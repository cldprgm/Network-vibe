from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics
from rest_framework.response import Response
from copy import deepcopy

from django.db.models import Count, Exists, Value, OuterRef, Prefetch, Subquery
from django.db.models.fields import BooleanField
from django.core.cache import cache

from apps.communities.models import Community
from apps.communities.serializers import CommunityListSerializer
from apps.communities.views import CommunityPagination
from apps.memberships.models import Membership

from .models import Category
from .serializers import ParentCategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ParentCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ['get']
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user

        limited_communities = Community.objects.filter(
            categories=OuterRef('categories')
        )[:6]

        base_communities_qs = Community.objects.filter(
            id__in=Subquery(limited_communities.values('id'))
        ).select_related('creator').annotate(members_count=Count('members', distinct=True))

        # add (members__is_approved=True) later
        if user.is_authenticated:
            membership_qs = Membership.objects.filter(
                user=user,
                community=OuterRef('pk')
            )
            base_communities_qs = base_communities_qs.annotate(
                is_member=Exists(membership_qs))
        else:
            base_communities_qs = base_communities_qs.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        queryset = Category.objects.filter(parent__isnull=True).prefetch_related(
            Prefetch(
                'children',
                queryset=Category.objects.prefetch_related(
                    Prefetch(
                        'communities',
                        queryset=base_communities_qs
                    )
                )
            )
        )

        return queryset

    def list(self, request, *args, **kwargs):
        user = request.user
        cache_key = 'categories_tree:list'

        cache_data = cache.get(cache_key)
        if cache_data:
            data = cache_data.copy()

            if user.is_authenticated:

                community_ids = []
                for category in data:
                    for child in category.get('subcategories', []):
                        for community in child.get('communities', []):
                            community_ids.append(community['id'])

                membership = Membership.objects.filter(
                    user=user,
                    community__id__in=community_ids
                ).values('community_id')
                membership_set = {m['community_id'] for m in membership}

                for category in data:
                    for child in category.get('subcategories', []):
                        for community in child.get('communities', []):
                            community['is_member'] = community['id'] in membership_set
            else:
                for category in data:
                    for child in category.get('subcategories', []):
                        for community in child.get('communities', []):
                            community['is_member'] = False
            return Response(data)

        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        cache_data = deepcopy(data)
        for category in cache_data:
            for child in category.get('subcategories', []):
                for community in child.get('communities', []):
                    community.pop('is_member', None)
        cache.set(cache_key, cache_data, 60 * 15)

        return Response(data)


class CategoryCommunityListView(generics.ListAPIView):
    serializer_class = CommunityListSerializer
    pagination_class = CommunityPagination

    def get_queryset(self):
        subcategory_id = self.kwargs['subcategory_id']
        user = self.request.user

        base_queryset = Community.objects.filter(categories=subcategory_id) \
            .select_related('creator') \
            .annotate(members_count=Count('members', distinct=True))

        # add (members__is_approved=True) later
        if user.is_authenticated:
            membership_qs = Membership.objects.filter(
                user=user,
                community=OuterRef('pk')
            )
            base_queryset = base_queryset.annotate(
                is_member=Exists(membership_qs))
        else:
            base_queryset = base_queryset.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        return base_queryset

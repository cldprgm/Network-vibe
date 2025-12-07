from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics
from rest_framework.response import Response

from django.db.models import Exists, Value, OuterRef
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
        return Category.objects.filter(parent__isnull=True).prefetch_related('children')

    def list(self, request, *args, **kwargs):
        user = request.user
        cache_key = 'categories_tree:list'

        data = cache.get(cache_key)

        # save data in cache without is_member
        if data is None:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            data = serializer.data

            cache.set(cache_key, data, timeout=60*9)

        # cache or not, add is_member
        if user.is_authenticated:
            community_ids = set()
            for category in data:
                for child in category.get('subcategories', []):
                    for community in child.get('communities', []):
                        community_ids.add(community['id'])

            if community_ids:
                membership_set = set(
                    Membership.objects.filter(
                        user=user,
                        community__id__in=community_ids
                    ).values_list('community_id', flat=True)
                )

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


class CategoryCommunityListView(generics.ListAPIView):
    serializer_class = CommunityListSerializer
    pagination_class = CommunityPagination

    def get_queryset(self):
        subcategory_id = self.kwargs['subcategory_id']
        user = self.request.user

        base_queryset = Community.objects.filter(categories=subcategory_id) \
            .select_related('creator') \
            .order_by('-activity_score', '-members_count', '-id')

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

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework import generics

from django.db.models import Count, Exists, Value, OuterRef
from django.db.models.fields import BooleanField

from apps.communities.models import Community
from apps.communities.serializers import CommunitySerializer
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
        queryset = Category.objects.filter(
            parent__isnull=True).prefetch_related('children')

        return queryset


class CategoryCommunityListView(generics.ListAPIView):
    serializer_class = CommunitySerializer
    pagination_class = CommunityPagination

    def get_queryset(self):
        subcategory_id = self.kwargs['subcategory_id']
        user = self.request.user

        base_queryset = Community.objects.filter(categories=subcategory_id).select_related(
            'creator').annotate(members_count=Count('members'))

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

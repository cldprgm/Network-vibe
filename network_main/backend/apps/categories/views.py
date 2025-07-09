from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from django.db.models import Prefetch, Count, Q, OuterRef, Exists, Value
from django.db.models.fields import BooleanField

from apps.communities.models import Community
from apps.users.models import CustomUser
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

        base_communities_qs = Community.objects.select_related('creator').annotate(
            members_count=Count('members')
        )

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

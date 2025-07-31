from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Count, Prefetch, Exists, OuterRef, Value
from django.db.models.fields import BooleanField

from apps.communities.models import Community
from apps.memberships.models import Membership
from apps.communities.views import CommunityPagination
from apps.communities.serializers import CommunityListSerializer


class CommunityRecommendationView(views.APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = CommunityPagination

    def get(self, request):
        user = request.user
        paginator = self.pagination_class()

        subscribed = Community.objects.filter(members__user=user)

        if not subscribed.exists():
            queryset = Community.objects.annotate(
                members_count=Count('members')
            )[:10].select_related('creator')
            response_type = 'just_popular_communities'
        else:
            interested_categories_ids = subscribed.values_list(
                'categories', flat=True).distinct()
            queryset = Community.objects.filter(
                categories__id__in=interested_categories_ids
            ).exclude(pk__in=subscribed).select_related('creator')
            response_type = 'recommended_communities'

        # add (members__is_approved=True) later
        if user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'members',
                    queryset=Membership.objects.filter(user=user),
                    to_attr='current_user_memberships'
                )
            ).annotate(
                is_member=Exists(
                    Membership.objects.filter(
                        user=user, community=OuterRef('pk'))
                )
            )
        else:
            queryset = queryset.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        queryset = queryset.annotate(members_count=Count('members'))

        page = paginator.paginate_queryset(queryset, request, view=self)
        serializer = CommunityListSerializer(
            page, many=True, context={'request': request})

        paginated_response = paginator.get_paginated_response(serializer.data)
        paginated_response.data['type'] = response_type
        paginated_response.data['recommendations'] = paginated_response.data.pop(
            'results')

        return paginated_response

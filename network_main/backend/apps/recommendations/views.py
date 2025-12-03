from rest_framework import generics
from rest_framework.pagination import CursorPagination

from django.db.models import Exists, OuterRef

from apps.communities.models import Community
from apps.communities.serializers import CommunityListSerializer


class CommunityRecommendationPagination(CursorPagination):
    page_size = 12
    ordering = ('-activity_score', '-members_count', '-pk')


class CommunityRecommendationView(generics.ListAPIView):
    pagination_class = CommunityRecommendationPagination
    serializer_class = CommunityListSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            queryset = (
                Community.objects
                .order_by('-activity_score', '-members_count', '-pk')
                .select_related('creator')
            )

            self._response_type = 'unauthenticated_recommendations'
            return queryset

        subscribed = Community.objects.filter(members__user=user)

        if not subscribed.exists():
            queryset = (
                Community.objects
                .order_by('-members_count', '-pk')
                .select_related('creator')
            )
            self._response_type = 'just_popular_communities'
        else:
            category_ids = subscribed.values_list(
                'categories', flat=True
            )

            has_category = Community.categories.through.objects.filter(
                community_id=OuterRef('pk'),
                category_id__in=category_ids
            )

            queryset = (
                Community.objects
                .filter(Exists(has_category))
                .exclude(pk__in=subscribed)
                .order_by('-activity_score', '-members_count', '-pk')
                .select_related('creator')
            )

            self._response_type = 'recommended_communities'

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['type'] = getattr(self, '_response_type', '')
        response.data['recommendations'] = response.data.pop('results', [])
        return response

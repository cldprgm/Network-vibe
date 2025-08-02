from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from django.db.models import Count, Q
from django.utils import timezone

from datetime import timedelta

from apps.communities.models import Community
from apps.communities.serializers import CommunityListSerializer


class CommunityRecommendationPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 12


class CommunityRecommendationView(generics.ListAPIView):
    pagination_class = CommunityRecommendationPagination
    serializer_class = CommunityListSerializer

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            since = timezone.now() - timedelta(days=3)
            queryset = (
                Community.objects
                .annotate(posts_last_days=Count('owned_posts', filter=Q(owned_posts__created__gte=since)),
                          members_count=Count('members', distinct=True))
                .order_by('-posts_last_days', '-members_count', '-pk')
                .select_related('creator')
            )
            self._response_type = 'unauthenticated_recommendations'
            return queryset

        subscribed = Community.objects.filter(members__user=user)

        if not subscribed.exists():
            queryset = (
                Community.objects
                .annotate(members_count=Count('members'))
                .order_by('-members_count')[:6]
                .select_related('creator')
            )
            self._response_type = 'just_popular_communities'
        else:
            category_ids = (
                subscribed
                .values_list('categories', flat=True)
                .distinct()
            )
            queryset = (
                Community.objects
                .filter(categories__id__in=category_ids)
                .exclude(pk__in=subscribed)
                .annotate(members_count=Count('members'))
                .select_related('creator')
            )
            self._response_type = 'recommended_communities'

        return queryset

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['type'] = getattr(self, '_response_type', '')
        response.data['recommendations'] = response.data.pop('results', [])
        return response

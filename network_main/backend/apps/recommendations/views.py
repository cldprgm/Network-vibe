from rest_framework import generics
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination

from django.db.models import Exists, OuterRef
from django.core.cache import cache

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
            category_ids = list(
                subscribed.values_list('categories', flat=True).distinct()
            )

            subscribed_ids = list(
                subscribed.values_list('pk', flat=True)
            )

            has_category = Community.categories.through.objects.filter(
                community_id=OuterRef('pk'),
                category_id__in=category_ids
            )

            queryset = (
                Community.objects
                .filter(Exists(has_category))
                .exclude(pk__in=subscribed_ids)
                .order_by('-activity_score', '-members_count', '-pk')
                .select_related('creator')
            )

            self._response_type = 'recommended_communities'

        return queryset

    def list(self, request, *args, **kwargs):
        user = request.user
        cursor_params = request.query_params.get('cursor')

        cache_key = None
        should_cache = False
        cache_timeout = 60*5

        if user.is_authenticated:
            if not cursor_params:
                cache_key = f'auth_recs_first_page:{user.id}'
                should_cache = True
        else:
            cursor_key = cursor_params if cursor_params else 'initial'
            cache_key = f'unauth_recs:{cursor_key}'
            should_cache = True
            cache_timeout = 60*9

        if should_cache and cache_key:
            cached_data = cache.get(cache_key)
            if cached_data:
                return Response(cached_data)

        response = super().list(request, *args, **kwargs)

        response.data['type'] = getattr(self, '_response_type', '')
        response.data['recommendations'] = response.data.pop('results', [])

        if should_cache and cache_key:
            cache.set(cache_key, response.data, timeout=cache_timeout)

        return response

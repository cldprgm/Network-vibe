from datetime import timedelta
from functools import partial

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.pagination import CursorPagination
from rest_framework.permissions import AllowAny

from django.db.models import (
    Exists, OuterRef, Case,
    When, Value, F
)
from django.db.models.fields import FloatField
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.utils import timezone

from apps.communities.models import Community
from apps.posts.models import Post
from apps.posts.views import get_optimized_post_queryset
from apps.posts.serializers import PostListSerializer
from apps.ratings.models import Rating
from apps.communities.serializers import CommunityListSerializer


def get_user_recommendations(request):
    user = request.user
    post_content_type = ContentType.objects.get_for_model(Post)

    liked_posts = Rating.objects.filter(
        user=user, value=1, content_type=post_content_type
    ).values_list('object_id', flat=True)[:30]

    liked_communities = Post.objects.filter(
        id__in=liked_posts
    ).values_list('community_id', flat=True).distinct()

    time_threshold = timezone.now() - timedelta(days=90)
    queryset = Post.published.filter(
        created__gte=time_threshold
    ).exclude(id__in=liked_posts)

    w_community = 0.6

    queryset = queryset.annotate(
        community_relevance=Case(
            When(community_id__in=liked_communities, then=Value(w_community)),
            default=0.1,
            output_field=FloatField()
        ),
        personalized_score=F('score') + F('community_relevance')
    ).order_by('-personalized_score')

    return queryset


def get_trending_posts(days=3):
    time_threshold = timezone.now() - timedelta(days=days)

    queryset = Post.published.filter(
        created__gte=time_threshold
    ).order_by('-score')

    return queryset


def paginate_ids_by_cursor(post_ids, cursor_id, page_size=25):
    """
    Finds cursor_id in the list and returns the next batch
    """
    if not cursor_id:
        return post_ids[:page_size], post_ids[page_size] if len(post_ids) > page_size else None
    try:
        cursor_index = post_ids.index(int(cursor_id))

        start_index = cursor_index + 1
        end_index = start_index + page_size

        page_ids = post_ids[start_index:end_index]

        next_cursor = page_ids[-1] if len(page_ids) > 0 and len(
            post_ids) > end_index else None

        return page_ids, next_cursor

    except ValueError:
        return [], None


class PostRecommendationView(generics.ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = PostListSerializer

    def get_queryset(self):
        return get_optimized_post_queryset(request=self.request)

    def list(self, request, *args, **kwargs):
        cursor_id = request.query_params.get('cursor')

        if request.user.is_authenticated:
            cache_key = f'user_recommendations:{request.user.id}'
            query_function = partial(get_user_recommendations, request)
            cache_timeout = 300

        else:
            cache_key = f'trending_posts_ids'
            query_function = partial(get_trending_posts, days=30)
            cache_timeout = 240

        post_ids = cache.get(cache_key)

        if post_ids is None:
            queryset = query_function()
            post_ids = list(queryset.values_list('id', flat=True)[:2000])
            cache.set(cache_key, post_ids, timeout=cache_timeout)

        page_ids, next_cursor = paginate_ids_by_cursor(
            post_ids,
            cursor_id,
            page_size=25
        )

        if not page_ids:
            return Response({'next_cursor': None, 'results': []})

        base_queryset = self.get_queryset()
        preserved_order = Case(*[When(pk=pk_val, then=pos)
                               for pos, pk_val in enumerate(page_ids)])
        queryset = base_queryset.filter(
            pk__in=page_ids
        ).order_by(preserved_order)

        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'next_cursor': next_cursor,
            'results': serializer.data
        })


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

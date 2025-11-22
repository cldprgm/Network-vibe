from functools import partial

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import mixins

from django.core.exceptions import PermissionDenied
from django.db.models import (
    OuterRef, Subquery,
    IntegerField, FloatField,
    Value, F, Case, When
)
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.cache import cache

from datetime import timedelta

from apps.ratings.models import Rating

from .models import Post, Comment
from .serializers import (
    PostDetailSerializer,
    PostListSerializer,
    CommentDetailSerializer,
    RatingSerializer,
    CommentSummarySerializer
)


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

    w_community = 0.5

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


def get_annotated_ratings(queryset, request, content_type: ContentType):
    user = request.user
    if user.is_authenticated:
        user_vote_subquery = Rating.objects.filter(
            content_type=content_type,
            object_id=OuterRef('pk'),
            user=user
        ).values('value')[:1]

        queryset = queryset.annotate(
            user_vote=Coalesce(
                Subquery(user_vote_subquery, output_field=IntegerField()),
                Value(0),
                output_field=IntegerField()
            )
        )
    else:
        queryset = queryset.annotate(
            user_vote=Value(0, output_field=IntegerField())
        )

    return queryset


def get_optimized_post_queryset(request):
    queryset = Post.published.all().select_related('community')
    post_content_type = ContentType.objects.get_for_model(Post)

    queryset = get_annotated_ratings(queryset, request, post_content_type)

    common_prefetch = [
        'media_data',
    ]

    qs = queryset.prefetch_related(*common_prefetch)

    return qs


class PostPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 30


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


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        return get_optimized_post_queryset(request=self.request)

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        return PostDetailSerializer

    def list(self, request, *args, **kwargs):
        cursor_id = request.query_params.get('cursor')

        if request.user.is_authenticated:
            cache_key = f'user_recommendations:{request.user.id}'
            query_function = partial(get_user_recommendations, request)
            cache_timeout = 300

        else:
            cache_key = f'trending_posts_ids'
            query_function = partial(get_trending_posts, days=10)
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

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().author != self.request.user:
            raise PermissionDenied('You cannot edit this post.')
        serializer.save()

    def perform_destroy(self, instance):
        if self.get_object().author != self.request.user:
            raise PermissionDenied('You cannot delete this post.')
        instance.delete()

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[IsAuthenticatedOrReadOnly], url_path='ratings')
    def ratings(self, request, slug=None):
        post = self.get_object()

        if request.method == 'GET':
            return Response({
                'sum_rating': post.sum_rating,
                'user_vote': post.user_vote,
            })

        elif request.method == 'POST':
            serializer = RatingSerializer(
                data=request.data,
                context={'request': request, 'view': self}
            )
            serializer.is_valid(raise_exception=True)

            rating_instance = serializer.save()

            post.refresh_from_db()

            return Response({
                'rating': serializer.data,
                'sum_rating': post.sum_rating,
                'user_vote': rating_instance.value,
            }, status=status.HTTP_201_CREATED if serializer.created else status.HTTP_200_OK)

        elif request.method == 'DELETE':
            Rating.objects.filter(
                content_type=ContentType.objects.get_for_model(Post),
                object_id=post.id,
                user=request.user
            ).delete()

            post.refresh_from_db()

            return Response({
                'sum_rating': post.sum_rating,
                'user_vote': 0,
            }, status=status.HTTP_202_ACCEPTED)


class CommentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentDetailSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CommentPagination
    lookup_field = 'pk'

    def get_queryset(self):
        slug = self.kwargs['slug']
        post = get_object_or_404(Post, slug=slug)

        queryset = (
            Comment.objects
            .filter(post=post)
            .select_related('author')
            .with_ratings(self.request.user)
            .order_by('-time_created')
        )

        if self.action == 'list':
            return queryset.filter(parent__isnull=True)
        return queryset

    def perform_create(self, serializer):
        slug = self.kwargs.get('slug')
        post = get_object_or_404(Post, slug=slug)
        serializer.save(post=post)

    def perform_update(self, serializer):
        if self.get_object().author != self.request.user:
            raise PermissionDenied('You cannot edit this comment.')
        serializer.save()

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[IsAuthenticatedOrReadOnly], url_path='ratings')
    def ratings(self, request, pk, slug=None):
        comment = self.get_object()

        if request.method == 'GET':
            return Response({
                'sum_rating': comment.sum_rating,
                'user_vote': comment.user_vote,
            })

        elif request.method == 'POST':
            serializer = RatingSerializer(
                data=request.data,
                context={'request': request, 'view': self}
            )
            serializer.is_valid(raise_exception=True)
            rating = serializer.save()

            comment = Comment.objects.filter(
                pk=comment.pk).with_ratings(request.user).first()

            return Response({
                'rating': serializer.data,
                'sum_rating': comment.sum_rating,
                'user_vote': comment.user_vote,
            }, status=status.HTTP_201_CREATED if serializer.created else status.HTTP_200_OK)

        elif request.method == 'DELETE':
            comment.ratings.filter(user=request.user).delete()
            comment = Comment.objects.filter(
                pk=comment.pk).with_ratings(request.user).first()

            return Response({
                'sum_rating': comment.sum_rating,
                'user_vote': comment.user_vote,
            }, status=status.HTTP_202_ACCEPTED)


class CommentRepliesViewSet(mixins.ListModelMixin,
                            viewsets.GenericViewSet):
    serializer_class = CommentSummarySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CommentPagination
    lookup_field = 'pk'

    def get_queryset(self):
        parent_id = self.kwargs['pk']
        return (
            Comment.objects
            .filter(parent_id=parent_id, status='PB')
            .select_related('author')
            .with_ratings(self.request.user)
            .order_by('time_created')
        )

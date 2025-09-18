import random

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import mixins

from django.core.exceptions import PermissionDenied
from django.db.models import (
    OuterRef, Subquery,
    IntegerField, FloatField,
    Value, Sum, Count, Max,
    Q, F, ExpressionWrapper,
    Case, When
)
from django.db.models.functions.math import Random
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce, Extract
from django.utils import timezone
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


def get_annotated_ratings(queryset, request, content_type: ContentType):
    ratings_sum_subquery = (
        Rating.objects.filter(
            content_type=content_type,
            object_id=OuterRef('pk')
        ).values('object_id').annotate(total=Coalesce(Sum('value'), Value(0))).values('total')[:1]
    )

    queryset = queryset.annotate(
        sum_rating=Coalesce(
            Subquery(ratings_sum_subquery, output_field=IntegerField()),
            Value(0),
            output_field=IntegerField()
        )
    )

    user = request.user
    if user.is_authenticated:
        queryset = queryset.annotate(
            user_vote=Coalesce(
                Max(
                    'ratings__value',
                    filter=Q(
                        ratings__content_type=content_type,
                        ratings__user=user
                    )
                ),
                Value(0),
                output_field=IntegerField()
            )
        )
    else:
        queryset = queryset.annotate(
            user_vote=Value(0, output_field=IntegerField())
        )

    return queryset


def get_optimized_post_queryset(request, action):
    if request.user.is_authenticated:
        queryset = get_user_recommendations(
            request,
            randomize_factor=0.7
        )
    else:
        queryset = get_trending_posts(request, days=2, randomize_factor=0.7)

    common_prefetch = [
        'media_data',
    ]

    qs = queryset.prefetch_related(*common_prefetch)

    return qs


def get_user_recommendations(request, randomize_factor=0.05):
    user = request.user
    now = timezone.now()
    post_content_type = ContentType.objects.get_for_model(Post)

    liked_posts = Rating.objects.filter(
        user=user, value=1, content_type=post_content_type
    ).values_list('object_id', flat=True)

    liked_communities = Post.objects.filter(
        id__in=liked_posts).values_list('community', flat=True).distinct()

    w_rating = 0.4
    w_comments = 0.2
    w_community = 0.2
    w_freshness = 0.2
    w_random = randomize_factor

    queryset = Post.published.all().exclude(id__in=liked_posts)

    queryset = get_annotated_ratings(
        queryset,
        request,
        content_type=post_content_type
    )

    comment_count_subquery = Comment.objects.filter(
        post=OuterRef('pk'),
        status='PB'
    ).values('post').annotate(count=Count('pk')).values('count')

    queryset = queryset.annotate(
        comment_count=Coalesce(
            Subquery(comment_count_subquery, output_field=IntegerField()),
            Value(0)
        ),
        hours_since_created=ExpressionWrapper(
            Extract((now - F('created')), 'epoch') / 3600.0,
            output_field=FloatField()
        ),
        freshness=ExpressionWrapper(
            1.0 / (1.0 + F('hours_since_created')),
            output_field=FloatField()
        ),
        community_relevance=Case(
            When(community__in=liked_communities, then=1.0),
            default=0.1,
            output_field=FloatField()
        ),
        random_factor=ExpressionWrapper(
            Random() * 0.4,
            output_field=FloatField()
        ),
        score=ExpressionWrapper(
            (w_rating * F('sum_rating')) +
            (w_comments * F('comment_count')) +
            (w_community * F('community_relevance')) +
            (w_freshness * F('freshness')) +
            (w_random * F('random_factor')),
            output_field=FloatField()
        )
    ).order_by('-score')

    return queryset


def get_trending_posts(request, days=3, randomize_factor=0.05):
    now = timezone.now()
    post_content_type = ContentType.objects.get_for_model(Post)

    time_threshold = now - timedelta(days=days)

    w_rating = 0.4
    w_comments = 0.2
    w_freshness = 0.3
    w_random = randomize_factor

    queryset = Post.published.filter(created__gte=time_threshold)

    queryset = get_annotated_ratings(
        queryset,
        request,
        content_type=post_content_type
    )

    comment_count_subquery = Comment.objects.filter(
        post=OuterRef('pk'),
        status='PB'
    ).values('post').annotate(count=Count('pk')).values('count')

    queryset = queryset.annotate(
        comment_count=Coalesce(
            Subquery(comment_count_subquery, output_field=IntegerField()),
            Value(0)
        ),
        hours_since_created=ExpressionWrapper(
            Extract((now - F('created')), 'epoch') / 3600.0,
            output_field=FloatField()
        ),
        freshness=ExpressionWrapper(
            1.0 / (1.0 + F('hours_since_created')),
            output_field=FloatField()
        ),
        random_factor=ExpressionWrapper(
            Random() * 0.4,
            output_field=FloatField()
        ),
        score=ExpressionWrapper(
            (w_rating * F('sum_rating')) +
            (w_comments * F('comment_count')) +
            (w_freshness * F('freshness')) +
            (w_random * F('random_factor')),
            output_field=FloatField()
        )
    ).order_by('-score')

    return queryset


class PostCursorPagination(CursorPagination):
    page_size = 25
    ordering = ('-score', '-created')
    cursor_query_param = 'cursor'


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PostCursorPagination
    lookup_field = 'slug'
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        return get_optimized_post_queryset(request=self.request, action=self.action)

    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        return PostDetailSerializer

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
            rating = serializer.save()

            post = Post.published.filter(pk=post.pk).annotate(
                sum_rating=Coalesce(
                    Sum('ratings__value', filter=Q(
                        ratings__content_type=ContentType.objects.get_for_model(Post))),
                    Value(0),
                    output_field=IntegerField()
                ),
                user_vote=Coalesce(
                    Subquery(
                        Rating.objects.filter(
                            content_type=ContentType.objects.get_for_model(
                                Post),
                            object_id=OuterRef('pk'),
                            user=request.user
                        ).order_by('-time_created').values('value')[:1],
                        output_field=IntegerField()
                    ),
                    Value(0),
                    output_field=IntegerField()
                )

            ).first()

            return Response({
                'rating': serializer.data,
                'sum_rating': post.sum_rating,
                'user_vote': post.user_vote,
            }, status=status.HTTP_201_CREATED if serializer.created else status.HTTP_200_OK)

        elif request.method == 'DELETE':
            Rating.objects.filter(
                content_type=ContentType.objects.get_for_model(Post),
                object_id=post.id,
                user=request.user
            ).delete()
            post = Post.published.filter(pk=post.pk).annotate(
                sum_rating=Coalesce(
                    Sum('ratings__value', filter=Q(
                        ratings__content_type=ContentType.objects.get_for_model(Post))),
                    Value(0),
                    output_field=IntegerField()
                ),
                user_vote=Value(0, output_field=IntegerField())
            ).first()

            return Response({
                'sum_rating': post.sum_rating,
                'user_vote': post.user_vote,
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
            .filter(post=post, status='PB')
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

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
    IntegerField, Value,
)
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models.functions import Coalesce

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


class PostPagination(CursorPagination):
    page_size = 25
    ordering = ('-created', '-id')


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    pagination_class = PostPagination

    def get_queryset(self):
        return get_optimized_post_queryset(request=self.request)

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

    # refactor later
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

    # refactor later
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
            .filter(parent_id=parent_id)
            .select_related('author')
            .with_ratings(self.request.user)
            .order_by('time_created')
        )

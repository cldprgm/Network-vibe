from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from django.core.exceptions import PermissionDenied
from django.db.models import OuterRef, Subquery, IntegerField, Value, Sum, Q
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models import Prefetch
from django.db.models.functions import Coalesce

from typing import Optional

from apps.ratings.models import Rating

from .models import Post, Comment
from .serializers import PostDetailSerializer, PostListSerializer, CommentSerializer, \
    RatingSerializer


def get_optimized_post_queryset(request, action: Optional[str] = None):
    queryset = Post.published.select_related('author', 'community')
    content_type = ContentType.objects.get_for_model(Post)

    queryset = queryset.annotate(
        sum_rating=Coalesce(
            Sum('ratings__value', filter=Q(ratings__content_type=content_type)),
            Value(0),
            output_field=IntegerField()
        )
    )

    user = request.user
    if user.is_authenticated:
        latest_rating = Rating.objects.filter(
            content_type=content_type,
            object_id=OuterRef('pk'),
            user=user
        )
        queryset = queryset.annotate(
            user_vote=Coalesce(
                Subquery(latest_rating.values('value')[
                         :1], output_field=IntegerField()),
                Value(0),
                output_field=IntegerField()
            )
        )
    else:
        queryset = queryset.annotate(
            user_vote=Value(0, output_field=IntegerField())
        )

    common_prefetch = [
        'media_data',
    ]

    if action == 'list':
        return queryset.prefetch_related(*common_prefetch)
    return queryset.prefetch_related(*common_prefetch, 'owned_comments')


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PageNumberPagination
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


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PageNumberPagination

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        if slug:
            post = get_object_or_404(Post, slug=slug)
            return self.queryset.filter(post=post)
        return self.queryset

    def perform_create(self, serializer):
        slug = self.kwargs.get('slug')
        post = get_object_or_404(Post, slug=slug)
        serializer.save(post=post)

    def perform_update(self, serializer):
        if self.get_object().author != self.request.user:
            raise PermissionDenied('You cannot edit this comment.')
        serializer.save()

    @action(detail=True, methods=['get', 'post', 'delete'], permission_classes=[IsAuthenticatedOrReadOnly], url_path='ratings')
    def ratings(self, request, slug=None, pk=None):
        comment = self.get_object()
        content_type = ContentType.objects.get_for_model(Comment)

        if request.method == 'GET':
            ratings = Rating.objects.filter(
                content_type=content_type, object_id=comment.id)
            serializer = RatingSerializer(
                ratings, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            serializer = RatingSerializer(data=request.data, context={
                                          'request': request, 'view': self})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            if serializer.created:
                return Response(serializer.data, status=201)
            else:
                return Response(serializer.data, status=200)

        elif request.method == 'DELETE':
            Rating.objects.filter(
                content_type=content_type,
                object_id=comment.id,
                user=request.user
            ).delete()
            return Response(status=204)

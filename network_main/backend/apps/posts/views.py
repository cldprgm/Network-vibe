from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.pagination import PageNumberPagination
from rest_framework.decorators import action

from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from django.db.models import Prefetch

from typing import Optional

from apps.ratings.models import Rating

from .models import Post, Comment
from .serializers import PostDetailSerializer, PostListSerializer, CommentSerializer, \
    RatingSerializer


def get_optimized_post_queryset(action: Optional[str] = None):
    queryset = Post.published.select_related('author', 'community')
    content_type = ContentType.objects.get_for_model(Post)
    if action == 'list':
        return queryset.prefetch_related(
            'media_data',
            Prefetch(
                'ratings',
                queryset=Rating.objects.filter(
                    content_type=content_type).select_related('user'),
                to_attr='prefetched_ratings'
            )
        )
    return queryset.prefetch_related(
        'media_data',
        'owned_comments',
        Prefetch(
            'ratings',
            queryset=Rating.objects.filter(
                content_type=content_type).select_related('user'),
            to_attr='prefetched_ratings'
        )
    )


class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = PageNumberPagination
    lookup_field = 'slug'

    def get_queryset(self):
        return get_optimized_post_queryset(action=self.action)

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
        content_type = ContentType.objects.get_for_model(Post)

        if request.method == 'GET':
            ratings = Rating.objects.filter(
                content_type=content_type, object_id=post.id)
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
                object_id=post.id,
                user=request.user
            ).delete()
            return Response(status=204)


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

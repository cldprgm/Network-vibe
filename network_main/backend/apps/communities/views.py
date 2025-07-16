from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count, OuterRef, Exists, Value, Q
from django.db.models.fields import BooleanField
from django.contrib.contenttypes.models import ContentType

from apps.memberships.models import Membership
from apps.posts.models import Post
from apps.posts.serializers import PostListSerializer
from apps.posts.views import PostPagination, get_annotated_ratings

from .models import Community
from .serializers import CommunitySerializer, MembershipSerializer


class CommunityPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 12


class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CommunityPagination
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Community.objects.select_related(
            'creator').annotate(members_count=Count('members'))

        user = self.request.user
        # add (members__is_approved=True) later
        if user.is_authenticated:
            membership_qs = Membership.objects.filter(
                user=user,
                community=OuterRef('pk')
            )
            queryset = queryset.annotate(is_member=Exists(membership_qs))
        else:
            queryset = queryset.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().creator != self.request.user:
            raise PermissionDenied('You cannot edit this community.')
        serializer.save()

    def get_serializer_context(self):
        return {'request': self.request}


class CommunityPostsListView(viewsets.GenericViewSet, mixins.ListModelMixin):
    serializer_class = PostListSerializer
    pagination_class = PostPagination

    def get_queryset(self):
        queryset = Post.published.filter(
            community__slug=self.kwargs['community_slug']
        ).prefetch_related('media_data')
        queryset = get_annotated_ratings(
            queryset, self.request, ContentType.objects.get_for_model(Post))
        queryset = queryset.annotate(
            comment_count=Count(
                'owned_comments', filter=Q(owned_comments__status='PB')
            )
        )
        return queryset


class MembershipViewSet(
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet
):
    serializer_class = MembershipSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'pk'

    def get_queryset(self):
        return Membership.objects.filter(
            user=self.request.user,
            community_id=self.kwargs['community_pk']
        )

    def perform_create(self, serializer):
        community = get_object_or_404(
            Community, pk=self.kwargs['community_pk'])
        serializer.save(user=self.request.user, community=community)

    @action(detail=False, methods=['delete'], url_path='leave', url_name='leave')
    def leave_community(self, request, community_pk=None):
        membership = self.get_queryset().first()

        if not membership:
            return Response({'detail': 'membership not found'}, status=status.HTTP_404_NOT_FOUND)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

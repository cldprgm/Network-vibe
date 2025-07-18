from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count, OuterRef, Exists, Value, Q, Prefetch
from django.db.models.fields import BooleanField
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from apps.memberships.models import Membership
from apps.posts.models import Post
from apps.posts.serializers import PostListSerializer
from apps.posts.views import PostPagination, get_annotated_ratings

from .models import Community
from .serializers import CommunityListSerializer, CommunityDetailSerializer, MembershipSerializer
from .community_permissions import PERMISSONS_MAP


class IsCommunityCreator(BasePermission):

    def has_object_permission(self, request, view, obj):
        for m in getattr(obj, 'current_user_memberships', []):
            if m.role == Membership.Role.CREATOR:
                return True
        return False


class HasCommunityPermission(BasePermission):

    def has_object_permission(self, request, view, obj):
        permission = getattr(view, 'requiered_permission', None)
        if not permission or not request.user.is_authenticated:
            return False
        roles = obj.members.filter(
            user=request.user).values_list('role', flat=True)
        user_permissions = {
            permission
            for role in roles
            for permission in PERMISSONS_MAP.get(role, [])
        }
        print(user_permissions)
        return permission in user_permissions


class CannotLeaveIfCreator(BasePermission):

    def has_object_permission(self, request, view, obj):
        if obj.role == Membership.Role.CREATOR:
            return False
        return True


class CommunityPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 12


class CommunityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CommunityPagination
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'delete']:
            return [IsAuthenticated(), IsCommunityCreator()]

        if self.action == 'invite':
            self.requiered_permission = 'invite_member'
            return [IsAuthenticated(), HasCommunityPermission()]

        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'list':
            return CommunityListSerializer
        return CommunityDetailSerializer

    def get_queryset(self):
        queryset = Community.objects.select_related(
            'creator').annotate(members_count=Count('members'))

        user = self.request.user
        # add (members__is_approved=True) later
        if user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'members',
                    queryset=Membership.objects.filter(user=user),
                    to_attr='current_user_memberships'
                )
            ).annotate(
                is_member=Exists(
                    Membership.objects.filter(
                        user=user, community=OuterRef('pk'))
                )
            )
        else:
            queryset = queryset.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        return queryset

    # add later
    @action(detail=True, methods=['post'])
    def invite(self, request, slug=None):
        # just test
        community = self.get_object()
        return Response({'status': 'ok'})

    @transaction.atomic
    def perform_create(self, serializer):
        community = serializer.save(creator=self.request.user)
        Membership.objects.create(
            user=self.request.user,
            community=community,
            role=Membership.Role.CREATOR
        )

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
    permission_classes = [IsAuthenticated, CannotLeaveIfCreator]
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

        self.check_object_permissions(request, membership)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

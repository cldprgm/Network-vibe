from rest_framework import viewsets, mixins, status, views
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination

from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.db.models import Count, OuterRef, Exists, Value, Q, Prefetch
from django.db.models.fields import BooleanField
from django.db import transaction
from django.contrib.contenttypes.models import ContentType

from apps.memberships.models import Membership
from apps.posts.models import Post
from apps.posts.views import PostPagination, get_annotated_ratings

from .models import Community
from .serializers import (
    CommunityListSerializer,
    CommunityDetailSerializer,
    MembershipSerializer,
    CommunityPostListSerializer
)
from .community_permissions import IsCommunityCreator, HasCommunityPermission, CannotLeaveIfCreator
from .community_permissions import PERMISSONS_MAP


class CommunityPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 12


class CommunityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    pagination_class = CommunityPagination
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
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
        queryset = Community.objects.select_related('creator').annotate(
            members_count=Count('members')
        )

        user = self.request.user
        # add (members__is_approved=True) later
        if user.is_authenticated:
            queryset = queryset.prefetch_related(
                Prefetch(
                    'members',
                    queryset=Membership.objects.filter(user=user),
                    to_attr='current_user_memberships'
                )).annotate(
                is_member=Exists(
                    Membership.objects.filter(
                        user=user, community=OuterRef('pk'))
                )
            )
        else:
            queryset = queryset.annotate(
                is_member=Value(False, output_field=BooleanField())
            )

        if self.action != 'list':
            queryset = queryset.prefetch_related('categories')

        return queryset

    def retrieve(self, request, *args, **kwargs):
        slug = self.kwargs.get('slug')
        cache_key = f'community:{slug}'

        cache_data = cache.get(cache_key)
        if cache_data:
            data = cache_data.copy()
            if request.user.is_authenticated:
                membership = Membership.objects.filter(
                    user=request.user, community__slug=slug
                ).first()
                if membership:
                    data['is_member'] = True
                    data['current_user_roles'] = [membership.role]
                    data['current_user_permissions'] = list(
                        set(PERMISSONS_MAP.get(membership.role, []))
                    )
                else:
                    data['is_member'] = False
                    data['current_user_roles'] = []
                    data['current_user_permissions'] = []
            else:
                data['is_member'] = False
                data['current_user_roles'] = []
                data['current_user_permissions'] = []
            return Response(data)

        instance = self.get_queryset().get(slug=slug)

        serializer = CommunityDetailSerializer(
            instance,
            context={'request': request}
        )
        data = serializer.data

        data['online_members'] = instance.get_online_members_count()

        cache_data = {
            k: v for k, v in data.items()
            if k not in ['is_member', 'current_user_roles', 'current_user_permissions']
        }
        cache.set(cache_key, cache_data, 60 * 15)
        return Response(data)

    # add later
    @action(detail=True, methods=['post'])
    def invite(self, request, slug=None):
        # just test
        community = self.get_object()
        return Response({'status': 'ok'})

    @action(detail=False, methods=['get'], url_path='top')
    def top_communities(self, request):
        cache_key = 'top_100_community'

        data = cache.get(cache_key)
        if data:
            return Response(data)

        queryset = Community.objects.all().select_related('creator')

        top_communities = queryset.annotate(
            members_count=Count('members')
        ).order_by('-members_count')[:100]

        serializer = CommunityListSerializer(
            top_communities,
            many=True,
            context={'request': request}
        )

        cache.set(cache_key, serializer.data, timeout=86400)
        return Response(serializer.data)

    @transaction.atomic
    def perform_create(self, serializer):
        community = serializer.save(creator=self.request.user)
        Membership.objects.create(
            user=self.request.user,
            community=community,
            role=Membership.Role.CREATOR
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.creator != self.request.user:
            raise PermissionDenied('You cannot edit this community.')
        serializer.save()
        cache.delete(f"community:{instance.slug}")

    def get_serializer_context(self):
        return {'request': self.request}


class CommunityPostsListView(viewsets.GenericViewSet, mixins.ListModelMixin):
    serializer_class = CommunityPostListSerializer
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


class CommunityNameCheck(views.APIView):
    def get(self, request):
        name = request.query_params.get('name', None)
        if not name:
            return Response({'error': 'Name not provided'}, status=status.HTTP_400_BAD_REQUEST)
        is_taken = Community.objects.filter(name__iexact=name).exists()
        return Response({'is_taken': is_taken}, status=status.HTTP_200_OK)


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
        serializer.save(
            user=self.request.user,
            community=community,
            role=Membership.Role.MEMBER
        )

    @action(detail=False, methods=['delete'], url_path='leave', url_name='leave')
    def leave_community(self, request, community_pk=None):
        membership = self.get_queryset().first()

        if not membership:
            return Response({'detail': 'membership not found'}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, membership)

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

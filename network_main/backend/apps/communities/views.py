from rest_framework import viewsets, mixins, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action

from django.core.exceptions import PermissionDenied
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from apps.posts.views import get_optimized_post_queryset
from apps.memberships.models import Membership

from .models import Community
from .serializers import CommunitySerializer, MembershipSerializer


class CommunityViewSet(viewsets.ModelViewSet):
    serializer_class = CommunitySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'id'

    def get_queryset(self):
        # queryset = Community.objects.select_related('creator').prefetch_related(
        #     Prefetch(
        #         'owned_posts',
        #         queryset=get_optimized_post_queryset(action='list')
        #     )
        # )
        return Community.objects.select_related('creator')

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().creator != self.request.user:
            raise PermissionDenied('You cannot edit this community.')
        serializer.save()

    def get_serializer_context(self):
        return {'request': self.request}


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

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response

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
    lookup_field = 'slug'

    def get_queryset(self):
        # queryset = Community.objects.select_related('creator').prefetch_related(
        #     Prefetch(
        #         'owned_posts',
        #         queryset=get_optimized_post_queryset(action='list')
        #     )
        # )
        return Community.objects.all()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        if self.get_object().creator != self.request.user:
            raise PermissionDenied('You cannot edit this community.')
        serializer.save()

    def get_serializer_context(self):
        return {'request': self.request}


class MembershipViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_community(self, slug):
        return get_object_or_404(Community, slug=slug)

    def create(self, request, slug=None):
        community = self.get_community(slug)

        membership, created = Membership.objects.get_or_create(
            user=request.user,
            community=community
        )

        if created:
            serializer = MembershipSerializer(
                membership,
                context={'request': request}
            )
            return Response(serializer.data, status=201)
        return Response({'detail': 'Already a member'}, status=400)

    def destroy(self, request, slug=None):
        community = self.get_community(slug)

        try:
            membership = Membership.objects.get(
                user=request.user,
                community=community
            )
            membership.delete()
            return Response(status=204)
        except Membership.DoesNotExist:
            return Response({'detail': 'Not a member'}, status=400)

from rest_framework import serializers
from django.shortcuts import get_object_or_404

from apps.posts.serializers import PostListSerializer
from apps.memberships.models import Membership

from .models import Community


class CommunitySerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'status', 'is_member')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated', 'slug')

    def get_is_member(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Membership.objects.filter(user=request.user, community=obj).exists()
        return False

    def get_moderators(self, obj):
        return obj.get_moderators()


class CurrentCommunityDefault:
    requires_context = True

    def __call__(self, serializer_field):
        view = serializer_field.context['view']
        community_pk = view.kwargs.get('community_pk')
        return get_object_or_404(Community, pk=community_pk)

    def __repr__(self):
        return '<CurrentCommunityDefault>'


class MembershipSerializer(serializers.ModelSerializer):
    community = serializers.HiddenField(default=CurrentCommunityDefault())

    class Meta:
        model = Membership
        fields = ('id', 'user', 'community', 'is_moderator',
                  'is_approved', 'joined_at')
        read_only_fields = ('id', 'user', 'joined_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

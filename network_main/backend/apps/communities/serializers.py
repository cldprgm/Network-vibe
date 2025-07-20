from rest_framework import serializers
from django.shortcuts import get_object_or_404

from apps.memberships.models import Membership

from .models import Community
from .community_permissions import PERMISSONS_MAP


class CommunityListSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'status', 'is_member', 'members_count')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated', 'slug')


class CommunityDetailSerializer(serializers.ModelSerializer):
    creator = serializers.StringRelatedField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    current_user_roles = serializers.SerializerMethodField()
    current_user_permissions = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'status', 'is_member', 'members_count',
                  'current_user_roles', 'current_user_permissions')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated', 'slug',
                            'current_user_roles', 'current_user_permissions')

    def get_current_user_roles(self, obj):
        return [m.role for m in getattr(obj, 'current_user_memberships', [])]

    def get_current_user_permissions(self, obj):
        roles = self.get_current_user_roles(obj)
        permissions = set()
        for role in roles:
            permissions.update(PERMISSONS_MAP.get(role, []))
        return list(permissions)


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
    role = serializers.CharField(read_only=True)

    class Meta:
        model = Membership
        fields = ('id', 'user', 'community', 'joined_at', 'role')
        read_only_fields = ('id', 'user', 'joined_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

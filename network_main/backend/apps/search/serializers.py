from rest_framework import serializers

from apps.communities.models import Community
from apps.users.serializers import CustomUserSerializer
from apps.users.models import CustomUser


class CommunitySearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Community
        fields = (
            'id', 'slug', 'name',
            'banner', 'icon', 'is_nsfw', 'visibility',
        )
        read_only_fields = fields


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id', 'slug', 'username', 'avatar',
        )
        read_only_fields = fields


class SearchSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    rank = serializers.FloatField()
    type = serializers.CharField()

    def to_representation(self, instance):
        communities_map = self.context.get('communities_map', '')
        users_map = self.context.get('users_map', '')

        obj_type = instance.get('type')
        obj_id = instance.get('id')

        if obj_type == 'community':
            obj = communities_map.get(obj_id)
            if obj:
                serializer = CommunitySearchSerializer(obj)
            else:
                None
        elif obj_type == 'user':
            obj = users_map.get(obj_id)
            if obj:
                serializer = UserSearchSerializer(obj)
            else:
                None
        else:
            return super().to_representation(instance)

        data = serializer.data
        data['type'] = obj_type
        return data

    def to_internal_value(self, data):
        return data

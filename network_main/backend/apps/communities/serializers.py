from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.core.validators import RegexValidator, MinLengthValidator

from apps.memberships.models import Membership
from apps.categories.models import Category

from apps.services.utils import FileSizeValidator, MimeTypeValidator
from .models import Community
from .community_permissions import PERMISSONS_MAP


name_validator = RegexValidator(
    regex=r'^[A-Za-zА-Яа-яЁё0-9_]+$',
    message='Name can contain only letters, numbers, and underscores.'
)


ALLOWED_COMMUNITY_IMAGE_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
]


class CommunityListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=21,
        validators=[MinLengthValidator(4), name_validator]
    )
    creator = serializers.StringRelatedField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)

    icon = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'status', 'is_member', 'members_count')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated', 'slug')

    def get_icon(self, obj):
        return obj.icon.url if obj.icon else 'uploads/community/icons/default_icon.png'

    def get_banner(self, obj):
        return obj.banner.url if obj.banner else 'uploads/community/icons/default_icon.png'


class CommunityDetailSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=21,
        validators=[MinLengthValidator(4), name_validator]
    )
    creator = serializers.StringRelatedField(read_only=True)
    is_member = serializers.BooleanField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    current_user_roles = serializers.SerializerMethodField()
    current_user_permissions = serializers.SerializerMethodField()
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True
    )

    icon = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    icon_upload = serializers.FileField(
        write_only=True, required=False, source='icon'
    )
    banner_upload = serializers.FileField(
        write_only=True, required=False, source='banner'
    )

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'status', 'is_member', 'members_count',
                  'categories', 'current_user_roles', 'current_user_permissions',
                  'icon_upload', 'banner_upload')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated', 'slug',
                            'current_user_roles', 'current_user_permissions')

    def get_icon(self, obj):
        return obj.icon.url if obj.icon else 'uploads/community/icons/default_icon.png'

    def get_banner(self, obj):
        return obj.banner.url if obj.banner else 'uploads/community/icons/default_icon.png'

    def validate_categories(self, value):
        if not value:
            raise ValidationError('At least one catgory is required.')
        if len(value) > 3:
            raise ValidationError('You can select up to three categories.')
        return value

    def validate_icon_upload(self, value):
        MimeTypeValidator(
            allowed_mime_types=ALLOWED_COMMUNITY_IMAGE_TYPES
        )(value)

        FileSizeValidator(max_size_mb=7)(value)

        try:
            from PIL import Image
            img = Image.open(value)
            img.verify()
        except Exception:
            raise ValidationError(
                ("Upload a valid image. The file you uploaded was either not an image or a corrupted image."),
            )
        value.seek(0)
        return value

    def validate_banner_upload(self, value):
        MimeTypeValidator(
            allowed_mime_types=ALLOWED_COMMUNITY_IMAGE_TYPES
        )(value)

        FileSizeValidator(max_size_mb=10)(value)

        try:
            from PIL import Image
            img = Image.open(value)
            img.verify()
        except Exception:
            raise ValidationError(
                ("Upload a valid image. The file you uploaded was either not an image or a corrupted image."),
            )
        value.seek(0)
        return value

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

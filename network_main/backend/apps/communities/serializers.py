from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.core.validators import RegexValidator, MinLengthValidator

from apps.memberships.models import Membership
from apps.categories.models import Category
from apps.posts.models import Post
from apps.posts.serializers import MediaSerializer

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


class CommunityBaseSerializer(serializers.ModelSerializer):
    name = serializers.CharField(
        max_length=21,
        validators=[MinLengthValidator(4), name_validator]
    )
    creator = serializers.StringRelatedField(read_only=True)
    members_count = serializers.IntegerField(read_only=True)
    categories = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True
    )
    icon = serializers.SerializerMethodField()
    banner = serializers.SerializerMethodField()

    class Meta:
        model = Community
        fields = ('id', 'slug', 'name', 'creator', 'description',
                  'banner', 'icon', 'is_nsfw', 'visibility',
                  'created', 'updated', 'members_count',
                  'categories', 'activity_score')
        read_only_fields = ('id', 'slug', 'creator', 'created',
                            'updated')

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


class CommunityListSerializer(CommunityBaseSerializer):
    is_member = serializers.BooleanField(read_only=True)

    class Meta(CommunityBaseSerializer.Meta):
        fields = CommunityBaseSerializer.Meta.fields + ('is_member',)

    # categories not needed here
    def __init__(self, instance=None, data=..., **kwargs):
        super().__init__(instance, data, **kwargs)
        self.fields.pop('categories', None)


class CommunityDetailSerializer(CommunityBaseSerializer):
    is_member = serializers.BooleanField(read_only=True)
    current_user_roles = serializers.SerializerMethodField()
    current_user_permissions = serializers.SerializerMethodField()

    online_members = serializers.IntegerField(read_only=True)

    icon_upload = serializers.FileField(
        write_only=True, required=False, source='icon'
    )
    banner_upload = serializers.FileField(
        write_only=True, required=False, source='banner'
    )

    class Meta(CommunityBaseSerializer.Meta):
        fields = CommunityBaseSerializer.Meta.fields + ('is_member', 'icon_upload',
                                                        'banner_upload', 'current_user_roles',
                                                        'current_user_permissions', 'online_members')
        read_only_fields = ('current_user_roles', 'current_user_permissions')

    def get_is_member(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return Membership.objects.filter(user=user, community=obj).exists()
        return False

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


class CommunityPostListSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    author_slug = serializers.CharField(source='author.slug', read_only=True)
    author_icon = serializers.ImageField(
        source='author.avatar',
        read_only=True
    )
    comment_count = serializers.IntegerField(read_only=True)
    sum_rating = serializers.IntegerField(read_only=True)
    user_vote = serializers.IntegerField(read_only=True)

    media_data = MediaSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'description', 'status', 'author',
                  'created', 'updated', 'sum_rating', 'user_vote', 'comment_count',
                  'media_data', 'author_slug', 'author_icon')
        read_only_fields = ('id', 'slug', 'created', 'updated',
                            'author', 'media_data')


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

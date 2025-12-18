from django.contrib.auth import authenticate
from django.conf import settings
from django.core.cache import cache

from rest_framework import serializers

from apps.services.verification import send_verification_code, send_verification_link
from apps.services.utils import validate_magic_mime, validate_file_size, validate_files_length
from apps.communities.serializers import CommunityBaseSerializer

from .models import CustomUser, VerificationCode


User = settings.AUTH_USER_MODEL

ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
}


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = (
            'id', 'slug', 'username', 'first_name',
            'last_name', 'avatar', 'description', 'birth_date', 'gender',
            "date_joined"
        )
        read_only_fields = fields


class CustomUserCommunitiesSerializer(CommunityBaseSerializer):
    class Meta(CommunityBaseSerializer.Meta):
        fields = CommunityBaseSerializer.Meta.fields

    # fix later:
    #
    # categories not needed here
    def __init__(self, instance=None, data=..., **kwargs):
        super().__init__(instance, data, **kwargs)
        self.fields.pop('categories', None)


class CustomUserInfoSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = CustomUser
        fields = (
            'id', 'slug', 'username', 'email', 'first_name',
            'last_name', 'avatar', 'description', 'birth_date', 'gender',
            "date_joined"
        )
        read_only_fields = ('id', 'slug', 'date_joined')

    def validate_avatar(self, obj):
        validate_files_length([obj], max_files=1)
        validate_file_size(obj, max_file_size_mb=5)
        validate_magic_mime(obj, allowed_mime_types=ALLOWED_MIME_TYPES)
        return obj


class RegisterUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password',)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            is_active=False
        )
        send_verification_link(user)
        return user


class GoogleAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)


class GithubAuthSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)


class VerifyCodeSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        try:
            user = CustomUser.objects.get(email=attrs['email'])
            verification_code = VerificationCode.objects.filter(
                user=user, code=attrs['code']
            ).latest('created_at')

            if not verification_code.is_valid():
                raise serializers.ValidationError(
                    'Verification code is expired'
                )

        except (CustomUser.DoesNotExist, VerificationCode.DoesNotExist):
            raise serializers.ValidationError('Invalid email or code')

        return attrs


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class LoginUserSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(**attrs)
        if user and user.is_active:
            return user
        raise serializers.ValidationError('Incorrect credentials!')

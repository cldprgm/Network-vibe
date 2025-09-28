from django.contrib.auth import authenticate
from rest_framework import serializers
from django.conf import settings

from apps.services.verification import send_verification_code

from .models import CustomUser, VerificationCode


User = settings.AUTH_USER_MODEL


class CustomUserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 'slug', 'username', 'email', 'first_name',
            'last_name', 'avatar', 'description', 'birth_date', 'gender'
        )
        read_only_fields = ('id', 'slug')

    def get_avatar(self, obj):
        return obj.avatar.url if obj.avatar else '/media/uploads/avatars/default.png'


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
        send_verification_code(user)
        return user


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

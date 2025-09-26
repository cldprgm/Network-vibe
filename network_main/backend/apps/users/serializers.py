from django.contrib.auth import authenticate
from rest_framework import serializers
from django.conf import settings

from ..services.verification import send_verification_code

from .models import CustomUser


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
            # change on False later
            is_active=True
        )
        send_verification_code(user)
        return user


class LoginUserSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(**attrs)
        if user and user.is_active:
            return user
        raise serializers.ValidationError('Incorrect credentials!')

from rest_framework import serializers

from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'slug', 'username', 'email', 'first_name',
            'last_name', 'avatar', 'description', 'birth_date', 'gender'
        )
        read_only_fields = ('id', 'slug')

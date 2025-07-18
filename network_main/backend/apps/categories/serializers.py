from rest_framework import serializers

from apps.communities.serializers import CommunityListSerializer

from .models import Category


class ChildCategorySerializer(serializers.ModelSerializer):
    communities = CommunityListSerializer(many=True, read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Category
        fields = ('id', 'title', 'slug', 'parent_id', 'communities')
        read_only_fields = ('id', 'title', 'slug', 'parent_id')


class ParentCategorySerializer(serializers.ModelSerializer):
    subcategories = ChildCategorySerializer(
        many=True,
        read_only=True,
        source='children'
    )
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Category
        fields = ('id', 'title', 'slug', 'parent_id', 'subcategories')
        read_only_fields = ('id', 'title', 'slug', 'parent_id',
                            'subcategories')

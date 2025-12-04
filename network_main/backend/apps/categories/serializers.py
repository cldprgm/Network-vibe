from rest_framework import serializers

from apps.communities.serializers import CommunityListSerializer

from .models import Category


class ChildCategorySerializer(serializers.ModelSerializer):
    communities = serializers.SerializerMethodField()
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

    # N+1 but we avoid one big(slow) request
    def get_communities(self, obj):
        queryset = (
            obj.communities.all()
            .select_related('creator')
            .order_by('-created')[:6]
        )

        return CommunityListSerializer(
            queryset,
            many=True,
            context=self.context
        ).data


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

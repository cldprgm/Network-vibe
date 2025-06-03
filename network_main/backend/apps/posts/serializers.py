from rest_framework import serializers

from django.contrib.contenttypes.models import ContentType

from apps.communities.models import Community
from apps.ratings.models import Rating

from .models import Post, Comment, Media


class MediaSerializer(serializers.ModelSerializer):
    media_type = serializers.SerializerMethodField()
    aspect_ratio = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Media
        fields = ('id', 'file', 'media_type',
                  'aspect_ratio', 'file_url', 'uploaded_at')
        read_only_fields = ('id', 'media_type',
                            'aspect_ratio', 'file_url', 'uploaded_at')

    def get_media_type(self, obj):
        return obj.get_media_type()

    def get_aspect_ratio(self, obj):
        return obj.get_aspect_ratio()

    def get_file_url(self, obj):
        return obj.file.url


class CommentSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    sum_rating = serializers.SerializerMethodField()
    children = serializers.SerializerMethodField()
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )

    class Meta:
        model = Comment
        fields = ('id', 'author', 'content', 'time_created',
                  'time_updated', 'status', 'parent_id', 'children',
                  'sum_rating')
        read_only_fields = ('id', 'author', 'time_created', 'time_updated',
                            'status', 'children', 'sum_rating')

    def get_sum_rating(self, obj):
        return obj.get_sum_rating()

    def get_children(self, obj):
        children = obj.children.all()
        return CommentSerializer(children, many=True, context=self.context).data

    def validate_parent_id(self, value):
        if value:
            slug = self.context['view'].kwargs.get('slug')
            try:
                post = Post.objects.get(slug=slug)
                if value.post != post:
                    serializers.ValidationError(
                        'Parent comment must belong to the same post.')
            except Post.DoesNotExist:
                serializers.ValidationError('Post does not exist.')

        return value

    def create(self, validated_data):
        parent = validated_data.pop('parent_id', None)
        comment = Comment.objects.create(
            author=self.context['request'].user,
            parent=parent,
            **validated_data
        )
        return comment


class PostListSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(),
        write_only=True
    )
    community_name = serializers.StringRelatedField(
        source='community',
        read_only=True
    )
    sum_rating = serializers.SerializerMethodField()
    media_data = MediaSerializer(many=True, read_only=True)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'description', 'status', 'author',
                  'community', 'community_name', 'created', 'updated',
                  'sum_rating', 'user_vote', 'media_data', 'media_files')
        read_only_fields = ('id', 'slug', 'created', 'updated',
                            'author', 'community_name', 'media_data')

    def get_sum_rating(self, obj):
        return obj.get_sum_rating()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(Post)
            rating = Rating.objects.filter(
                content_type=content_type,
                object_id=obj.id,
                user=request.user
            ).first()
            return rating.value if rating else 0
        return 0


class PostDetailSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    community = serializers.PrimaryKeyRelatedField(
        queryset=Community.objects.all(),
        write_only=True
    )
    community_name = serializers.StringRelatedField(
        source='community',
        read_only=True
    )
    sum_rating = serializers.SerializerMethodField()
    media_data = MediaSerializer(many=True, read_only=True)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )
    owned_comments = CommentSerializer(many=True, read_only=True)
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'description', 'status', 'author',
                  'community', 'community_name', 'created', 'updated',
                  'sum_rating', 'user_vote', 'media_data', 'media_files',
                  'owned_comments')
        read_only_fields = ('id', 'slug', 'created', 'updated',
                            'author', 'community_name', 'media_data',
                            'owned_comments')

    def create(self, validated_data):
        media_files = validated_data.pop('media_files', [])
        post = Post.objects.create(**validated_data)
        for file in media_files:
            Media.objects.create(post=post, file=file)
        return post

    def update(self, validated_data):
        media_files = validated_data.pop('media_files', [])
        post = super().update(validated_data)
        if media_files:
            for file in media_files:
                Media.objects.create(post=post, file=file)
        return post

    def get_sum_rating(self, obj):
        return obj.get_sum_rating()

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            content_type = ContentType.objects.get_for_model(Post)
            rating = Rating.objects.filter(
                content_type=content_type,
                object_id=obj.id,
                user=request.user
            ).first()
            return rating.value if rating else 0
        return 0


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    value = serializers.ChoiceField(choices=[(1, 'upvote'), (-1, 'downvote')])
    user_vote = serializers.SerializerMethodField()
    sum_rating = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ('id', 'user', 'value', 'time_created',
                  'user_vote', 'sum_rating')
        read_only_fields = ('id', 'user', 'time_created',
                            'user_vote', 'sum_rating')

    def get_user_vote(self, obj):
        return obj.value if obj else 0

    def get_sum_rating(self, obj):
        return obj.content_object.get_sum_rating() if obj.content_object else 0

    def validate(self, attrs):
        request = self.context['request']
        view = self.context['view']
        content_type = None
        object_id = None

        if 'slug' in view.kwargs and 'pk' not in view.kwargs:
            content_type = ContentType.objects.get_for_model(Post)
            slug = view.kwargs['slug']
            try:
                post = Post.objects.get(slug=slug)
                object_id = post.id
            except Post.DoesNotExist:
                raise serializers.ValidationError('Post does not exist.')
        elif 'slug' in view.kwargs and 'pk' in view.kwargs:
            content_type = ContentType.objects.get_for_model(Comment)
            object_id = view.kwargs['pk']
            try:
                post = Post.objects.get(slug=view.kwargs['slug'])
                if not Comment.objects.filter(pk=object_id).exists():
                    raise serializers.ValidationError(
                        'Comment does not exist.')
            except Post.DoesNotExist:
                raise serializers.ValidationError('Post does not exist.')

        attrs['content_type'] = content_type
        attrs['object_id'] = object_id
        attrs['user'] = request.user
        attrs['ip_address'] = request.META.get('REMOTE_ADDR')
        return attrs

    def create(self, validated_data):
        rating, created = Rating.objects.update_or_create(
            content_type=validated_data['content_type'],
            object_id=validated_data['object_id'],
            user=validated_data['user'],
            defaults={
                'value': validated_data['value'],
                'ip_address': validated_data['ip_address'],
            }
        )
        self.created = created
        return rating

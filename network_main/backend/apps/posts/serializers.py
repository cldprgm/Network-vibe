from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from django.contrib.contenttypes.models import ContentType

from bleach import clean
from collections import defaultdict

from apps.communities.models import Community
from apps.ratings.models import Rating

from apps.services.utils import validate_magic_mime, validate_file_size

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

    def validate_file(self, uploaded_file):
        validate_magic_mime(uploaded_file)
        return uploaded_file

    def get_media_type(self, obj):
        return obj.get_media_type()

    def get_aspect_ratio(self, obj):
        return obj.get_aspect_ratio()

    def get_file_url(self, obj):
        return obj.file.url


class CommentSummarySerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    replies_count = serializers.IntegerField(
        source='get_children_count', read_only=True)
    sum_rating = serializers.IntegerField(read_only=True)
    user_vote = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'content', 'time_created',
                  'time_updated', 'sum_rating', 'user_vote', 'replies_count')
        read_only_fields = fields


class CommentDetailSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Comment.objects.all(),
        required=False,
        allow_null=True,
        write_only=True
    )
    replies_count = serializers.IntegerField(
        source='get_children_count', read_only=True)

    sum_rating = serializers.IntegerField(read_only=True)
    user_vote = serializers.IntegerField(read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'author', 'content', 'time_created',
                  'time_updated', 'sum_rating', 'user_vote',
                  'parent_id', 'replies_count')
        read_only_fields = ('id', 'author', 'time_created', 'time_updated', )

    def validate_content(self, content):
        return clean(content, tags=[], attributes={}, strip=True)

    def validate_parent_id(self, value):
        if value:
            slug = self.context['view'].kwargs.get('slug')
            try:
                post = Post.objects.get(slug=slug)
                if value.post != post:
                    raise ValidationError(
                        'Parent comment must belong to the same post.')
            except Post.DoesNotExist:
                raise ValidationError('Post does not exist.')

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
    community_obj = serializers.PrimaryKeyRelatedField(
        source='community',
        queryset=Community.objects.all(),
        write_only=True
    )
    community_id = serializers.PrimaryKeyRelatedField(
        source='community.id',
        read_only=True
    )
    community_name = serializers.StringRelatedField(
        source='community.name',
        read_only=True
    )
    community_icon = serializers.ImageField(
        source='community.icon',
        read_only=True
    )
    comment_count = serializers.IntegerField(read_only=True)
    sum_rating = serializers.IntegerField(read_only=True)
    user_vote = serializers.IntegerField(read_only=True)

    media_data = MediaSerializer(many=True, read_only=True)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'description', 'status', 'author',
                  'created', 'updated', 'sum_rating', 'user_vote', 'comment_count',
                  'community_id', 'community_name', 'community_icon',
                  'community_obj', 'media_data', 'media_files')
        read_only_fields = ('id', 'slug', 'created', 'updated',
                            'author', 'media_data')


class PostDetailSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField(read_only=True)
    community_obj = serializers.PrimaryKeyRelatedField(
        source='community',
        queryset=Community.objects.all(),
        write_only=True
    )
    community_id = serializers.PrimaryKeyRelatedField(
        source='community.id',
        read_only=True
    )
    community_name = serializers.StringRelatedField(
        source='community.name',
        read_only=True
    )
    community_icon = serializers.ImageField(
        source='community.icon',
        read_only=True
    )
    comment_count = serializers.IntegerField(read_only=True)
    sum_rating = serializers.IntegerField(read_only=True)
    user_vote = serializers.IntegerField(read_only=True)

    media_data = MediaSerializer(many=True, read_only=True)
    media_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = ('id', 'title', 'slug', 'description', 'status', 'author',
                  'created', 'updated', 'sum_rating', 'user_vote', 'comment_count',
                  'community_id', 'community_name', 'community_icon',
                  'community_obj', 'media_data',  'media_files')
        read_only_fields = ('id', 'slug', 'created', 'updated',
                            'author', 'media_data')

    def validate_title(self, value):
        return clean(value, tags=[], attributes={}, strip=True)

    # use it after adding WYSIWYG
    #
    # def validate_description(self, value):
    #     return clean(value, tags=[], attributes={}, strip=True)

    def validate_media_files(self, media_files):
        for file in media_files:
            validate_file_size(file)
            validate_magic_mime(file)
        return media_files

    # def get_owned_comments(self, post):
    #     flat = getattr(post, 'comments_flat', [])
    #     tree = defaultdict(list)

    #     for c in flat:
    #         tree[c.parent_id].append(c)

    #     def build(nodes):
    #         output = []
    #         for node in nodes:
    #             data = CommentSerializer(node, context=self.context).data
    #             data['children'] = build(tree.get(node.id, []))
    #             output.append(data)
    #         return output

    #     return build(tree.get(None, []))

    def create(self, validated_data):
        media_files = validated_data.pop('media_files', [])
        post = Post.objects.create(**validated_data)
        for file in media_files:
            Media.objects.create(post=post, file=file)
        return post

    def update(self, instance, validated_data):
        media_files = validated_data.pop('media_files', [])
        post = super().update(instance, validated_data)
        if media_files:
            for file in media_files:
                Media.objects.create(post=post, file=file)
        return post


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)
    value = serializers.ChoiceField(choices=[(1, 'upvote'), (-1, 'downvote')])

    class Meta:
        model = Rating
        fields = ('id', 'user', 'value', 'time_created')
        read_only_fields = ('id', 'user', 'time_created')

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
                raise ValidationError('Post does not exist.')
        elif 'slug' in view.kwargs and 'pk' in view.kwargs:
            content_type = ContentType.objects.get_for_model(Comment)
            object_id = view.kwargs['pk']
            try:
                post = Post.objects.get(slug=view.kwargs['slug'])
                if not Comment.objects.filter(pk=object_id).exists():
                    raise ValidationError('Comment does not exist.')
            except Post.DoesNotExist:
                raise ValidationError('Post does not exist.')
        else:
            raise ValidationError('Invalid URL parameters.')

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

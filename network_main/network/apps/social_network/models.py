from django.db import models
from django.core.validators import FileExtensionValidator
from django.contrib.auth.models import User
from django.urls import reverse
from django.core.validators import MinLengthValidator
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db.models import Sum, Count

from PIL import Image
import os

from apps.services.utils import unique_slugify

from mptt.models import MPTTModel, TreeForeignKey, TreeManyToManyField

from .validators import validate_file_size


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('author__profile', 'community').filter(status='PB').order_by('-created')


class Category(MPTTModel):
    """
    Nested Category model for communities
    """

    title = models.CharField(max_length=255, verbose_name='Category name')
    slug = models.SlugField(
        max_length=255, verbose_name='Category URL', blank=True)
    description = models.TextField(
        max_length=300, verbose_name='Category description')
    parent = TreeForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True,
        related_name='children',
        verbose_name='Parent category'
    )

    class MPTTMeta:
        """
        Sorting by nesting
        """
        order_insertion_by = ('title', )

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def get_absolute_url(self):
        return reverse('post_by_category', kwargs={'slug': self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# update after adding Membership model
class Community(models.Model):
    """Community model"""

    VISIBILITY_STATUS = (
        ('PUBLIC', 'Public'),
        ('RESTRICTED', 'Restricted'),
        ('PRIVATE', 'Private'),
    )

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    creator = models.ForeignKey(to=User, on_delete=models.SET_NULL,
                                related_name='created_communities', verbose_name='Creator', null=True)
    name = models.CharField(max_length=25, validators=[
                            MinLengthValidator(4)], unique=True, verbose_name='Community name')
    description = models.TextField(max_length=450, verbose_name='Description')
    banner = models.ImageField(
        upload_to='uploads/community/banners/%Y/%m/%d', verbose_name="Banner", null=True, blank=True, default='uploads/avatars/default.png', validators=[FileExtensionValidator(allowed_extensions=('jpg', 'png', 'jpeg'))])
    icon = models.ImageField(
        upload_to='uploads/community/icons/%Y/%m/%d', verbose_name='Icon', null=True, blank=True, default='uploads/avatars/default.png', validators=[FileExtensionValidator(allowed_extensions=('jpg', 'png', 'jpeg'))])
    categories = TreeManyToManyField(
        to=Category, related_name='communities', verbose_name='Categories')
    is_nsfw = models.BooleanField(default=False, verbose_name='is_NSFW')
    visibility = models.CharField(
        max_length=10, choices=VISIBILITY_STATUS, default='PUBLIC', verbose_name='Visibility')
    created = models.DateTimeField(
        auto_now_add=True, verbose_name='Create time')
    updated = models.DateTimeField(auto_now=True, verbose_name='Update time')
    slug = models.SlugField(max_length=255, verbose_name='URL', blank=True)
    status = models.CharField(choices=STATUS_OPTIONS, default='PB',
                              max_length=10, verbose_name="Community status")

    class Meta:
        ordering = ('created', )
        verbose_name = 'Community'
        verbose_name_plural = 'Communities'
        indexes = [models.Index(fields=['slug', 'visibility'])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def get_moderators(self):
        return self.members.filter(is_moderator=True).select_related('user')

    def get_absolute_url(self):
        return reverse("community_detail", kwargs={"slug": self.slug})

    def __str__(self):
        return self.name


class Membership(models.Model):
    """Connect user with community"""

    user = models.ForeignKey(to=User, on_delete=models.CASCADE,
                             related_name='memberships', verbose_name='User')
    community = models.ForeignKey(
        to=Community, on_delete=models.CASCADE, related_name='members', verbose_name='Community')
    is_moderator = models.BooleanField(default=False, verbose_name='Moderator')
    is_approved = models.BooleanField(
        default=False, verbose_name='Approved user')
    joined_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Joined at', db_index=True)

    class Meta:
        unique_together = ('user', 'community')
        verbose_name = 'Community member'
        verbose_name_plural = 'Community members'

    def __str__(self):
        return f'{self.user.username} in {self.community.name}'


class Rating(models.Model):

    content_type = models.ForeignKey(to=ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    user = models.ForeignKey(
        to=User, on_delete=models.CASCADE, verbose_name='User')
    value = models.IntegerField(
        choices=[(1, 'upvote'), (-1, 'downvote')], verbose_name='Rating value')
    time_created = models.DateTimeField(
        auto_now_add=True, verbose_name='Time created')
    ip_address = models.GenericIPAddressField(verbose_name='IP address')

    class Meta:
        unique_together = ('content_type', 'object_id', 'user')
        ordering = ('-time_created', )
        indexes = [
            models.Index(fields=['-time_created', 'value']),
            models.Index(
                fields=['content_type', 'object_id', '-time_created', 'value']),
            models.Index(fields=['user', 'content_type', 'object_id'])
        ]
        verbose_name = 'Rating'
        verbose_name_plural = 'Ratings'

    def __str__(self):
        return f'{self.content_object} - {self.value}'


# update after adding Membership model
class Post(models.Model):
    """Posts model"""

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    title = models.CharField(max_length=255, validators=[
                             MinLengthValidator(5)], verbose_name="Post title")
    slug = models.SlugField(
        max_length=255, verbose_name="URL", blank=True)
    description = models.TextField(
        max_length=500, verbose_name="Post description", blank=True, default='')
    status = models.CharField(choices=STATUS_OPTIONS,
                              default='PB', max_length=10, verbose_name="Post status")
    created = models.DateTimeField(
        auto_now_add=True, verbose_name="Create time")
    updated = models.DateTimeField(auto_now=True, verbose_name="Update time")
    author = models.ForeignKey(to=User, verbose_name="Author",
                               on_delete=models.CASCADE, related_name="author_posts", default=1)
    ratings = GenericRelation(to=Rating)
    community = models.ForeignKey(
        # delete a null=True
        to=Community, on_delete=models.CASCADE, related_name='posts', null=True)

    objects = models.Manager()
    published = PublishedManager()

    class Meta:
        db_table = 'network_post'
        ordering = ['-created']
        indexes = [models.Index(fields=['-created', 'status'])]
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'

    def get_absolute_url(self):
        return reverse("post_detail", kwargs={"slug": self.slug})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)

    def get_sum_rating(self):
        result = self.ratings.aggregate(total=Sum('value'))['total']
        return result if result is not None else 0

    def __str__(self):
        return self.title


class Comment(MPTTModel):
    """
    Tree Comment model
    """

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    post = models.ForeignKey(
        to=Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        to=User, on_delete=models.CASCADE, related_name='comments_author')
    content = models.TextField(max_length=500)
    time_created = models.DateTimeField(auto_now_add=True)
    time_updated = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=10, choices=STATUS_OPTIONS, default='PB')
    parent = TreeForeignKey('self', on_delete=models.CASCADE,
                            null=True, blank=True, related_name='children')
    ratings = GenericRelation(to=Rating)

    class MPTTMeta:
        order_insertion_by = ('-time_created', )

    class Meta:
        ordering = ('-time_created', )
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def get_sum_rating(self):
        if hasattr(self, 'sum_rating'):
            return self.sum_rating or 0
        content_type = ContentType.objects.get_for_model(Comment)
        ratings = Rating.objects.filter(
            content_type=content_type, object_id=self.id)
        return ratings.aggregate(sum_rating=Sum('value'))['sum_rating'] or 0

    def __str__(self):
        return f'{self.author}:{self.content}'


class Media(models.Model):
    MEDIA_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
    )

    post = models.ForeignKey(
        to=Post, on_delete=models.CASCADE, related_name='media', verbose_name='Post')
    file = models.FileField(
        upload_to='uploads/media/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(allowed_extensions=[
                                   "jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"]),
            validate_file_size
        ],
        verbose_name='Media file'
    )
    media_type = models.CharField(
        choices=MEDIA_TYPES, max_length=7, verbose_name='Type of media')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def get_aspect_ratio(self):
        if self.media_type == 'image':
            try:
                with Image.open(self.file.path) as img:
                    width, height = img.size
                    return f"{width}/{height}"
            except Exception as e:
                return "16/9"  # запасное значение
        return "16/9"  # для видео или ошибки

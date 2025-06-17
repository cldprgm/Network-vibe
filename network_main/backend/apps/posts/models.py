from django.db import models
from django.core.validators import MinLengthValidator, FileExtensionValidator
from django.contrib.contenttypes.fields import GenericRelation
from django.conf import settings

from mptt.models import MPTTModel
from mptt.fields import TreeForeignKey

from PIL import Image, ImageFile, UnidentifiedImageError
from PIL.Image import DecompressionBombError

import os

from apps.communities.models import Community
from apps.ratings.models import Rating
from apps.services.utils import unique_slugify, validate_file_size


User = settings.AUTH_USER_MODEL

Image.MAX_IMAGE_PIXELS = 20_000_000
ImageFile.LOAD_TRUNCATED_IMAGES = True


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('author', 'community').filter(status='PB').order_by('-created')


class Post(models.Model):
    """Posts model"""

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    title = models.CharField(max_length=300, validators=[
                             MinLengthValidator(5)], verbose_name="Post title")
    slug = models.SlugField(
        max_length=300, verbose_name="URL", blank=True)
    description = models.TextField(
        max_length=600, verbose_name="Post description", blank=True, default='')
    status = models.CharField(choices=STATUS_OPTIONS,
                              default='PB', max_length=10, verbose_name="Post status")
    created = models.DateTimeField(
        auto_now_add=True, verbose_name="Create time")
    updated = models.DateTimeField(auto_now=True, verbose_name="Update time")
    author = models.ForeignKey(to=User, verbose_name="Author",
                               on_delete=models.CASCADE, related_name="posts_created")
    ratings = GenericRelation(to=Rating)
    community = models.ForeignKey(
        # delete a null=True
        to=Community, on_delete=models.CASCADE, related_name='owned_posts', null=True)

    objects = models.Manager()
    published = PublishedManager()

    class Meta:
        db_table = 'api_network_post'
        ordering = ['-created']
        indexes = [models.Index(fields=['-created', 'status'])]
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'

    def save(self, *args, **kwargs):
        # fix self.title != Post.objects.get(pk=self.pk).title
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Comment(MPTTModel):
    """Tree Comment model"""

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    post = models.ForeignKey(
        to=Post, on_delete=models.CASCADE, related_name='owned_comments')
    author = models.ForeignKey(
        to=User, on_delete=models.CASCADE, related_name='author')
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
        db_table = 'api_network_comment'
        indexes = [models.Index(fields=['post', '-time_created'])]
        ordering = ('-time_created', )
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'{self.content}'


class Media(models.Model):
    MEDIA_EXTENSIONS = {
        'image': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        'video': ['mp4', 'webm'],
    }

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='media_data',
        verbose_name='Post'
    )

    file = models.FileField(
        upload_to='uploads/media/%Y/%m/%d/',
        validators=[
            FileExtensionValidator(
                allowed_extensions=sum(MEDIA_EXTENSIONS.values(), [])
            ),
            validate_file_size,
        ],
        verbose_name='File'
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'api_network_media'
        indexes = [models.Index(fields=['post'])]
        ordering = ['-uploaded_at']
        verbose_name = 'Mediafile'
        verbose_name_plural = 'Mediafiles'

    def get_media_type(self):
        ext = os.path.splitext(self.file.name)[1].lower().lstrip('.')
        for media_type, extensions in self.MEDIA_EXTENSIONS.items():
            if ext in extensions:
                return media_type
        return 'unknown'

    def get_aspect_ratio(self):
        if self.get_media_type() != 'image':
            return "16/9"
        try:
            with self.file.open('rb') as file:
                parser = ImageFile.Parser()
                header = file.read(8192)
                parser.feed(header)
                img = parser.close()
                width, height = img.size
                return f'{width}/{height}'
        except DecompressionBombError:
            return "16/9"
        except UnidentifiedImageError:
            return "16/9"
        except Exception:
            return "16/9"

    def __str__(self):
        return f"{self.get_media_type()} - {self.file.name}"

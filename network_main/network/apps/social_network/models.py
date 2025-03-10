from django.db import models
from django.core.validators import FileExtensionValidator
from django.contrib.auth.models import User
from django.urls import reverse

from PIL import Image
import os

from apps.services.utils import unique_slugify

from mptt.models import MPTTModel, TreeForeignKey

from .validators import validate_file_size


class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().select_related('author', 'category').filter(status='PB')


class Post(models.Model):
    """
    Model posts for network
    """

    STATUS_OPTIONS = (
        ("DF", "Draft"),
        ("PB", "Published"),
    )

    title = models.CharField(max_length=255, verbose_name="Post title")
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
    category = TreeForeignKey(
        'Category', on_delete=models.PROTECT, related_name='posts', verbose_name='category')

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
        self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


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


class Category(MPTTModel):
    """
    Nested Category model
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

    class MPTTMeta:
        order_insertion_by = ('-time_created', )

    class Meta:
        ordering = ('-time_created', )
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'{self.author}:{self.content}'

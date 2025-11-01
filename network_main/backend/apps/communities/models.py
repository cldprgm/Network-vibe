from django.db import models
from django.core.validators import MinLengthValidator, FileExtensionValidator, RegexValidator
from django.core.cache import cache
from django.conf import settings
from django_redis import get_redis_connection

import time

from mptt.fields import TreeManyToManyField

from apps.categories.models import Category
from apps.services.utils import unique_slugify, MimeTypeValidator, FileSizeValidator


User = settings.AUTH_USER_MODEL


class Community(models.Model):  # add members_count later
    """Community model"""

    class Visibility(models.TextChoices):
        PUBLIC = 'PUBLIC', 'Public'
        RESTRICTED = 'RESTRICTED', 'Restricted'
        PRIVATE = 'PRIVATE', 'Private'

    class Status(models.TextChoices):
        DRAFT = 'DF', 'Draft'
        PUBLISHED = 'PB', 'Published'

    name_validator = RegexValidator(
        regex=r'^[A-Za-zА-Яа-яЁё0-9_]+$',
        message='Name can contain only letters, numbers, and underscores.'
    )

    creator = models.ForeignKey(
        to=User,
        on_delete=models.SET_NULL,
        related_name='communities_created',
        verbose_name='Creator',
        null=True
    )
    name = models.CharField(
        max_length=21,
        validators=[MinLengthValidator(4), name_validator],
        unique=True,
        verbose_name='Community name'
    )
    description = models.TextField(
        max_length=420,
        validators=[MinLengthValidator(4)],
        verbose_name='Description'
    )
    banner = models.ImageField(
        upload_to='uploads/community/banners/%Y/%m/%d',
        verbose_name="Banner",
        null=True,
        blank=True,
        default='uploads/community/icons/default_icon.png',
        validators=[
            FileSizeValidator(max_size_mb=10),
            FileExtensionValidator(allowed_extensions=(
                'jpg', 'png', 'jpeg', 'webp')),
        ]
    )
    icon = models.ImageField(
        upload_to='uploads/community/icons/%Y/%m/%d',
        verbose_name='Icon',
        null=True,
        blank=True,
        default='uploads/community/icons/default_icon.png',
        validators=[
            FileSizeValidator(max_size_mb=7),
            FileExtensionValidator(allowed_extensions=(
                'jpg', 'png', 'jpeg', 'webp')),
        ]
    )
    categories = TreeManyToManyField(
        to=Category,
        related_name='communities',
        blank=False,
        verbose_name='Categories'
    )
    is_nsfw = models.BooleanField(default=False, verbose_name='is_NSFW')
    visibility = models.CharField(
        max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC, verbose_name='Visibility')
    created = models.DateTimeField(
        auto_now_add=True, verbose_name='Create time')
    updated = models.DateTimeField(auto_now=True, verbose_name='Update time')
    slug = models.SlugField(max_length=100, verbose_name='URL', blank=True)
    # delete this
    status = models.CharField(choices=Status.choices, default=Status.PUBLISHED,
                              max_length=10, verbose_name="Community status")

    class Meta:
        db_table = 'api_network_community'
        ordering = ('created', )
        verbose_name = 'Community'
        verbose_name_plural = 'Communities'
        indexes = [models.Index(fields=['slug', 'visibility'])]

    def save(self, *args, **kwargs):
        if not self.slug or Community.objects.filter(pk=self.pk, name=self.name).exists() is False:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def get_online_members_count(self) -> int:
        try:
            r = get_redis_connection('default')
            key = f'community:{self.pk}:online'

            border_time = int(time.time()) - 300

            r.zremrangebyscore(key, '-inf', border_time)

            online_count = r.zcard(key)

            return online_count
        except Exception:
            return 0

    def __str__(self):
        return self.name

from django.db import models
from django.core.validators import MinLengthValidator, FileExtensionValidator
from django.conf import settings

from mptt.fields import TreeManyToManyField

from apps.categories.models import Category
from apps.services.utils import unique_slugify


User = settings.AUTH_USER_MODEL


class Community(models.Model):
    """Community model"""

    class Visibility(models.TextChoices):
        PUBLIC = 'PUBLIC', 'Public'
        RESTRICTED = 'RESTRICTED', 'Restricted'
        PRIVATE = 'PRIVATE', 'Private'

    class Status(models.TextChoices):
        DRAFT = 'DF', 'Draft'
        PUBLISHED = 'PB', 'Published'

    creator = models.ForeignKey(
        to=User,
        on_delete=models.SET_NULL,
        related_name='communities_created',
        verbose_name='Creator',
        null=True
    )
    name = models.CharField(max_length=21, validators=[
                            MinLengthValidator(4)], unique=True, verbose_name='Community name')
    description = models.TextField(max_length=420, verbose_name='Description')
    banner = models.ImageField(
        upload_to='uploads/community/banners/%Y/%m/%d',
        verbose_name="Banner",
        null=True,
        blank=True,
        default='uploads/community/icons/default_icon.png',
        validators=[FileExtensionValidator(
            allowed_extensions=('jpg', 'png', 'jpeg'))]
    )
    icon = models.ImageField(
        upload_to='uploads/community/icons/%Y/%m/%d',
        verbose_name='Icon',
        null=True,
        blank=True,
        default='uploads/community/icons/default_icon.png',
        validators=[FileExtensionValidator(
            allowed_extensions=('jpg', 'png', 'jpeg'))]
    )
    categories = TreeManyToManyField(
        to=Category, related_name='communities', verbose_name='Categories')
    is_nsfw = models.BooleanField(default=False, verbose_name='is_NSFW')
    visibility = models.CharField(
        max_length=10, choices=Visibility.choices, default=Visibility.PUBLIC, verbose_name='Visibility')
    created = models.DateTimeField(
        auto_now_add=True, verbose_name='Create time')
    updated = models.DateTimeField(auto_now=True, verbose_name='Update time')
    slug = models.SlugField(max_length=100, verbose_name='URL', blank=True)
    status = models.CharField(choices=Status.choices, default=Status.PUBLISHED,
                              max_length=10, verbose_name="Community status")

    class Meta:
        db_table = 'api_network_community'
        ordering = ('created', )
        verbose_name = 'Community'
        verbose_name_plural = 'Communities'
        indexes = [models.Index(fields=['slug', 'visibility'])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

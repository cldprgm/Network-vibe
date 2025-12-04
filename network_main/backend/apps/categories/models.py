from django.db import models
from django.conf import settings

from mptt.fields import TreeForeignKey
from mptt.models import MPTTModel

from apps.services.utils import unique_slugify

User = settings.AUTH_USER_MODEL


class Category(MPTTModel):
    """
    Nested Category model for communities
    """

    title = models.CharField(max_length=255, verbose_name='Category name')
    slug = models.SlugField(
        max_length=255,
        verbose_name='Category URL',
        blank=True,
        unique=True
    )
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
        """Sorting by nesting"""
        order_insertion_by = ('title', )

    class Meta:
        db_table = 'api_network_category'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

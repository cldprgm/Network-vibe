from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.urls import reverse

from apps.services.utils import unique_slugify, validate_file_size


class User(AbstractUser):
    slug = models.SlugField(
        verbose_name='URL', max_length=75, blank=True, unique=True)
    avatar = models.ImageField(
        upload_to='uploads/avatars/%Y/%m/%d',
        default='uploads/avatars/default.png',
        validators=[FileExtensionValidator(
            allowed_extensions=('jpg', 'png', 'jpeg')),
            validate_file_size
        ]
    )
    description = models.TextField(max_length=200, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=6, choices=[(
        'male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)

    class Meta:
        ordering = ('username',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.username)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username

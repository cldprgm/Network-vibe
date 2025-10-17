import random

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator
from django.utils import timezone

from datetime import timedelta

from apps.services.utils import unique_slugify, validate_file_size

from .managers import CustomUserManager


class CustomUser(AbstractUser):
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    email = models.EmailField(unique=True, blank=False)
    username = models.CharField(max_length=25, unique=True,)
    slug = models.SlugField(
        verbose_name='URL', max_length=25, blank=True, unique=True)
    is_active = models.BooleanField(default=False)
    avatar = models.ImageField(
        upload_to='uploads/avatars/%Y/%m/%d',
        default='uploads/avatars/default.png',
        validators=[FileExtensionValidator(
            allowed_extensions=('jpg', 'png', 'jpeg', 'webp', 'gif')),
            validate_file_size
        ]
    )
    description = models.TextField(max_length=200, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    first_name = models.CharField(max_length=20, blank=True)
    last_name = models.CharField(max_length=20, blank=True)
    gender = models.CharField(
        max_length=6,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        blank=True
    )

    objects = CustomUserManager()

    class Meta:
        ordering = ('username',)
        indexes = [models.Index(fields=['slug'])]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.username)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username


def generate_code(length=6):
    return ''.join(str(random.randint(0, 9)) for _ in range(length))


class VerificationCode(models.Model):
    user = models.ForeignKey(to=CustomUser, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['user', 'code'])
        ]

    def is_valid(self):
        return timezone.now() <= self.expired_at

    def save(self, *args, **kwargs):
        if not self.expired_at:
            self.expired_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @classmethod
    def generate_for_user(cls, user):
        cls.objects.filter(user=user).delete()
        code = generate_code(length=6)
        instance = cls(user=user, code=code)
        instance.save()
        return code

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.urls import reverse
from apps.services.utils import unique_slugify


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    slug = models.SlugField(
        verbose_name='URL', max_length=255, blank=True, unique=True)
    avatar = models.ImageField(
        upload_to='uploads/avatars/%Y/%m/%d',
        default='uploads/avatars/default.png',
        validators=[FileExtensionValidator(
            allowed_extensions=('jpg', 'png', 'jpeg'))]
    )
    description = models.TextField(max_length=200, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=6, choices=[(
        'male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)

    class Meta:
        ordering = ('user',)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = unique_slugify(self, self.user.username)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse("profile_detail", kwargs={"slug": self.slug})

    def __str__(self):
        return self.user.username

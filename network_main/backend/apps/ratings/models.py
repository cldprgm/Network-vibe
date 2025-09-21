from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.conf import settings


User = settings.AUTH_USER_MODEL


class Rating(models.Model):
    """Rating model for posts and comments"""

    content_type = models.ForeignKey(to=ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    user = models.ForeignKey(
        to=User, on_delete=models.CASCADE, verbose_name='User')
    value = models.IntegerField(
        choices=[(1, 'upvote'), (-1, 'downvote')], verbose_name='Rating value')
    time_created = models.DateTimeField(
        auto_now_add=True, verbose_name='Time created')
    # Delete this later
    ip_address = models.GenericIPAddressField(verbose_name='IP address')

    class Meta:
        db_table = 'api_network_rating'
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

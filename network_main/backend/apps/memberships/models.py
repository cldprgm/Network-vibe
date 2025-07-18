from django.db import models
from django.conf import settings

from apps.communities.models import Community


User = settings.AUTH_USER_MODEL


class Membership(models.Model):
    """Connect user with community by specifying role"""

    class Role(models.TextChoices):
        CREATOR = 'CREATOR', 'Creator'
        MODERATOR = 'MODERATOR', 'Moderator'
        MEMBER = 'MEMBER', 'Member'

    user = models.ForeignKey(
        to=User,
        on_delete=models.CASCADE,
        related_name='user_memberships',
        verbose_name='User'
    )
    community = models.ForeignKey(
        to=Community,
        on_delete=models.CASCADE,
        related_name='members',
        verbose_name='Community'
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Joined at',
        db_index=True
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.MEMBER,
        verbose_name='Role'
    )

    class Meta:
        db_table = 'api_network_membership'
        ordering = ['-joined_at']
        unique_together = ('user', 'community')
        indexes = [
            models.Index(fields=['community', 'role']),
        ]
        verbose_name = 'Community member'
        verbose_name_plural = 'Community members'

    def __str__(self):
        return f'{self.user.username} in {self.community.name}'

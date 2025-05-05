from django.db import models
from django.conf import settings

from apps.communities.models import Community


User = settings.AUTH_USER_MODEL


class Membership(models.Model):
    """Connect user with community"""

    user = models.ForeignKey(to=User, on_delete=models.CASCADE,
                             related_name='user_memberships', verbose_name='User')
    community = models.ForeignKey(
        to=Community, on_delete=models.CASCADE, related_name='members', verbose_name='Community')
    is_moderator = models.BooleanField(default=False, verbose_name='Moderator')
    is_approved = models.BooleanField(
        default=False, verbose_name='Approved user')
    joined_at = models.DateTimeField(
        auto_now_add=True, verbose_name='Joined at', db_index=True)

    class Meta:
        db_table = 'api_network_membership'
        unique_together = ('user', 'community')
        verbose_name = 'Community member'
        verbose_name_plural = 'Community members'

    def __str__(self):
        return f'{self.user.username} in {self.community.name}'

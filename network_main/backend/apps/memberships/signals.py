from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models import Membership


@receiver([post_save, post_delete], sender=Membership)
def invalidate_first_community_page_cache(sender, instance, **kwargs):
    user_slug = instance.user.slug
    key = f'user_communities_first_page:{user_slug}'
    cache.delete(key)

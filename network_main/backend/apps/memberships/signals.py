from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from apps.communities.models import Community
from .models import Membership


@receiver([post_save, post_delete], sender=Membership)
def invalidate_first_community_page_cache(sender, instance, **kwargs):
    user_slug = instance.user.slug
    key = f'user_communities_first_page:{user_slug}'
    cache.delete(key)


def update_members_count(community_id):
    current_count = Membership.objects.filter(
        community_id=community_id).count()
    Community.objects.filter(pk=community_id).update(
        members_count=current_count)


@receiver([post_save, post_delete], sender=Membership)
def on_community_members_update(sender, instance, **kwargs):
    update_members_count(instance.community_id)

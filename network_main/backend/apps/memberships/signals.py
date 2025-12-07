from django.db.models.signals import post_save, post_delete
from django.db.models import F
from django.dispatch import receiver
from django.core.cache import cache

from apps.communities.models import Community
from .models import Membership


@receiver([post_save, post_delete], sender=Membership)
def invalidate_first_community_page_cache(sender, instance, **kwargs):
    user_slug = instance.user.slug
    key = f'user_communities_first_page:{user_slug}'
    cache.delete(key)


@receiver([post_save, post_delete], sender=Membership)
def invalidate_first_community_recommendations_page_cache(sender, instance, **kwargs):
    user_id = instance.user.id
    key = f'auth_recs_first_page:{user_id}'
    cache.delete(key)


@receiver(post_save, sender=Membership)
def on_member_join(sender, instance, created, **kwargs):
    if created:
        Community.objects.filter(pk=instance.community_id).update(
            members_count=F('members_count') + 1
        )


@receiver(post_delete, sender=Membership)
def on_member_leave(sender, instance, **kwargs):
    Community.objects.filter(pk=instance.community_id).update(
        members_count=F('members_count') - 1
    )

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models import Post


@receiver([post_save, post_delete], sender=Post)
def invalidate_first_page_cache(sender, instance, **kwargs):
    author_slug = instance.author.slug

    keys = [
        f"user_posts_first_page:{author_slug}:popular",
        f"user_posts_first_page:{author_slug}:new",
        f"user_posts_first_page:{author_slug}:None",
    ]

    cache.delete_many(keys)

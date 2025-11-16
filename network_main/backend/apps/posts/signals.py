from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models import Post, Comment


@receiver([post_save, post_delete], sender=Post)
def invalidate_first_page_cache(sender, instance, **kwargs):
    author_slug = instance.author.slug

    keys = [
        f"user_posts_first_page:{author_slug}:popular",
        f"user_posts_first_page:{author_slug}:new",
        f"user_posts_first_page:{author_slug}:None",
    ]

    cache.delete_many(keys)


def update_post_comment_count(post_id):
    try:
        post = Post.objects.get(pk=post_id)
        count = post.owned_comments.count()
        Post.objects.filter(pk=post_id).update(comment_count=count)
    except Post.DoesNotExist:
        pass


@receiver(post_save, sender=Comment)
def on_comment_save(sender, instance, **kwargs):
    update_post_comment_count(instance.post_id)


@receiver(post_delete, sender=Comment)
def on_comment_delete(sender, instance, **kwargs):
    update_post_comment_count(instance.post_id)

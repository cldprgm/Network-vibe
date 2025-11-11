from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum, Value
from django.db.models.functions import Coalesce

from apps.posts.models import Post
from apps.ratings.models import Rating


def update_post_rating(post_id):
    try:
        post = Post.objects.get(pk=post_id)

        new_sum = post.ratings.aggregate(
            total=Coalesce(Sum('value'), Value(0))
        )['total']

        Post.objects.filter(pk=post_id).update(sum_rating=new_sum)
    except Post.DoesNotExist:
        pass


@receiver(post_save, sender=Rating)
def on_rating_save(sender, instance, **kwargs):
    update_post_rating(instance.object_id)


@receiver(post_delete, sender=Rating)
def on_rating_delete(sender, instance, **kwargs):
    update_post_rating(instance.object_id)

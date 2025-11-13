from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum, Value
from django.db.models.functions import Coalesce

from apps.posts.models import Post, Comment
from apps.ratings.models import Rating


def update_object_rating(object_id, model):
    try:
        object = model.objects.get(pk=object_id)

        new_sum = object.ratings.aggregate(
            total=Coalesce(Sum('value'), Value(0))
        )['total']

        model.objects.filter(pk=object_id).update(sum_rating=new_sum)
    except model.DoesNotExist:
        pass


@receiver(post_save, sender=Rating)
def on_post_rating_save(sender, instance, **kwargs):
    update_object_rating(instance.object_id, Post)


@receiver(post_delete, sender=Rating)
def on_post_rating_delete(sender, instance, **kwargs):
    update_object_rating(instance.object_id, Post)


@receiver(post_save, sender=Rating)
def on_comment_rating_save(sender, instance, **kwargs):
    update_object_rating(instance.object_id, Comment)


@receiver(post_delete, sender=Rating)
def on_comment_rating_delete(sender, instance, **kwargs):
    update_object_rating(instance.object_id, Comment)

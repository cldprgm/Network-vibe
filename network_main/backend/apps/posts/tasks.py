from celery import shared_task

from django.utils import timezone
from django.db.models import F, ExpressionWrapper, FloatField, Case, When
from django.db.models.functions import Extract, Random

from datetime import timedelta

from .models import Post


@shared_task
def update_posts_score():
    """
    A periodic task for recalculating score of recent posts.
    """

    now = timezone.now()

    time_threshold = now - timedelta(days=30)

    w_rating = 0.4
    w_comments = 0.1
    w_freshness = 0.3
    w_random = 0.6

    posts_to_update = Post.published.filter(created__gte=time_threshold)

    updated_queryset = posts_to_update.annotate(
        hours_since_created=ExpressionWrapper(
            Extract((now - F('created')), 'epoch') / 3600.0,
            output_field=FloatField()
        ),
        freshness=ExpressionWrapper(
            1.0 / (1.0 + F('hours_since_created')),
            output_field=FloatField()
        ),
        random_factor=ExpressionWrapper(
            Random() * 0.4,
            output_field=FloatField()
        ),
        new_score=ExpressionWrapper(
            (w_rating * F('sum_rating')) +
            (w_comments * F('comment_count')) +
            (w_freshness * F('freshness')) +
            (w_random * F('random_factor')),
            output_field=FloatField()
        )
    )

    updated_queryset.update(score=F('new_score'))

    return f'Updated scores for {updated_queryset.count()} score'

from celery import shared_task

from django.utils import timezone
from django.db import transaction
from django.db.models import Count, F, ExpressionWrapper, FloatField
from django.db.models.functions import Extract, Random


from datetime import timedelta

from apps.posts.models import Post
from apps.communities.models import Community


@shared_task
def update_community_score():
    """
    A periodic task for recalculating activity_score in communities.
    """

    since = timezone.now() - timedelta(days=7)

    active_stats = (
        Post.objects
        .filter(created__gte=since)
        .values('community')
        .annotate(count=Count('id'))
    )

    communities_to_update = []
    active_community_ids = []

    for item in active_stats:
        c_id = item['community']
        count = item['count']

        active_community_ids.append(c_id)

        communities_to_update.append(
            Community(id=c_id, activity_score=count)
        )

    with transaction.atomic():
        if communities_to_update:
            Community.objects.bulk_update(
                communities_to_update,
                ['activity_score'],
                batch_size=2000
            )

        (
            Community.objects
            .filter(activity_score__gt=0)
            .exclude(id__in=active_community_ids)
            .update(activity_score=0)
        )

    return f"Updated community count: {len(communities_to_update)}"


@shared_task
def update_posts_score():
    """
    A periodic task for recalculating score of recent posts.
    """

    now = timezone.now()

    time_threshold = now - timedelta(days=90)

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

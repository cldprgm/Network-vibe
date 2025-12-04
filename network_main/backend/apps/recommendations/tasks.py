from celery import shared_task

from django.utils import timezone
from django.db import transaction
from django.db.models import Count

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

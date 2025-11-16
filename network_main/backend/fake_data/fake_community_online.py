from django_redis import get_redis_connection
import os
import random
import time
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'network.settings')
django.setup()


COMMUNITY_SLUG = 'first_community'
ONLINE_COUNT = 100000
TTL_SECONDS = 300


try:
    from apps.communities.models import Community
    from apps.memberships.models import Membership

    community = Community.objects.get(slug=COMMUNITY_SLUG)
    member_ids = list(Membership.objects.filter(
        community=community).order_by().values_list('user_id', flat=True))
    total_members = len(member_ids)

    if total_members == 0:
        print("No mebmers")
    else:
        print(f"Members count: {total_members}")

        if ONLINE_COUNT > total_members:
            ONLINE_COUNT = total_members

        users_to_make_online = random.sample(member_ids, ONLINE_COUNT)

        current_timestamp = int(time.time())
        data_to_add = {
            user_pk: current_timestamp for user_pk in users_to_make_online}

        r = get_redis_connection("default")
        key = f'community:{community.pk}:online'

        r.delete(key)

        r.zadd(key, data_to_add)

        r.expire(key, TTL_SECONDS)

        print("\nDone")

except Community.DoesNotExist:
    print(f"Community '{COMMUNITY_SLUG}' does not exists.")
except Exception as e:
    print(f"Error: {e}")

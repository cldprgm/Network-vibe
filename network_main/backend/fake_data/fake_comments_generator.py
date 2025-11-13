import os
import sys
import django
from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from faker import Faker
from random import choice, randint, random

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'network.settings')
django.setup()

fake = Faker()


def generate_comments(post_id, count=10000, max_depth=3):
    from apps.posts.models import Post
    from apps.users.models import CustomUser

    post = Post.objects.get(id=post_id)

    users = list(CustomUser.objects.all())

    existing_comments = []

    # top level comments (20%)
    top_level_count = int(count * 0.2)
    for _ in range(top_level_count):
        comment = _create_comment(post, users, parent=None)
        existing_comments.append(comment)

    # child comments (80%)
    for _ in range(count - top_level_count):
        if not existing_comments:
            comment = _create_comment(post, users, parent=None)
        else:
            parent = _select_parent(existing_comments, max_depth)
            comment = _create_comment(post, users, parent=parent)
            if parent:
                existing_comments.append(comment)

        existing_comments.append(comment)


def _create_comment(post, users, parent=None):
    from apps.posts.models import Comment
    author = choice(users)
    content = fake.text(max_nb_chars=randint(50, 450))
    if parent and random() > 0.7:
        content = f"@{parent.author.username}, {content[:400]}"

    days_ago = randint(0, 365)
    time_created = timezone.now() - timedelta(days=days_ago)
    time_updated = time_created + timedelta(minutes=randint(0, 60))

    with transaction.atomic():
        comment = Comment(
            post=post,
            author=author,
            content=content,
            status='PB',
            parent=parent,
        )
        comment._state.adding = True
        comment.time_created = time_created
        comment.time_updated = time_updated
        comment.save()
    return comment


def _select_parent(comments, max_depth):
    eligible = [c for c in comments if c.level < max_depth - 1]
    if eligible:
        return choice(eligible)
    return None


if __name__ == '__main__':
    generate_comments(post_id=15172, count=1000, max_depth=3)

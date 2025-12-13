import pytest
from datetime import timedelta
from django.utils import timezone

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.cache import cache
from django.contrib.contenttypes.models import ContentType


from apps.users.models import CustomUser
from apps.categories.models import Category
from apps.communities.models import Community
from apps.memberships.models import Membership
from apps.posts.models import Post, Comment, Media
from apps.ratings.models import Rating
from apps.posts.views import (
    get_annotated_ratings,
    get_optimized_post_queryset
)
from apps.recommendations.views import (
    get_user_recommendations,
    get_trending_posts
)
from apps.recommendations.tasks import update_posts_score


@pytest.fixture(autouse=True)
def clear_cache():
    """Clear cache before and after each test"""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return CustomUser.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpassword',
        is_active=True
    )


@pytest.fixture
def second_user():
    return CustomUser.objects.create_user(
        username='seconduser',
        email='second@example.com',
        password='secondpassword',
        is_active=True
    )


@pytest.fixture
def authenticated_client(api_client, test_user):
    api_client.force_authenticate(user=test_user)
    return api_client


@pytest.fixture
def category_python():
    return Category.objects.create(title='Python', slug='python')


@pytest.fixture
def category_gaming():
    return Category.objects.create(title='Gaming', slug='gaming')


@pytest.fixture
def community_python(second_user, category_python):
    community = Community.objects.create(
        creator=second_user,
        name='Python Fans',
        slug='python-fans',
        members_count=10,
        activity_score=50
    )
    community.categories.add(category_python)
    return community


@pytest.fixture
def community_django(second_user, category_python):
    community = Community.objects.create(
        creator=second_user,
        name='Django Ninjas',
        slug='django-ninjas',
        members_count=5,
        activity_score=100
    )
    community.categories.add(category_python)
    return community


@pytest.fixture
def community_gaming(second_user, category_gaming):
    community = Community.objects.create(
        creator=second_user,
        name='Gamers',
        slug='gamers',
        members_count=100,
        activity_score=10
    )
    community.categories.add(category_gaming)
    return community


@pytest.fixture
def category():
    return Category.objects.create(
        title='testcategory',
        slug='testcategory',
    )


@pytest.fixture
def community(test_user, category):
    community = Community.objects.create(
        creator=test_user,
        name='testcommunity',
        slug='testcommunity',
    )
    community.categories.add(category)
    return community


@pytest.fixture
def post(test_user, community):
    return Post.objects.create(
        author=test_user,
        title='testpost',
        community=community,
        status='PB'
    )


@pytest.fixture
def comment(test_user, post):
    return Comment.objects.create(
        post=post,
        author=test_user,
        content='testcomment',
    )


@pytest.fixture
def media_file(post):
    return Media.objects.create(
        post=post,
        file='uploads/avatars/default.png'
    )


@pytest.mark.django_db
class TestPostRecommendations:
    def test_get_user_recommendations_authenticated(self, authenticated_client, test_user, post, community):
        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(
            reverse('post-recommendations')).wsgi_request
        request.user = test_user
        queryset = get_user_recommendations(request)

        assert queryset.count() >= 0
        for post in queryset:
            assert hasattr(post, 'sum_rating')
            assert hasattr(post, 'comment_count')
            assert hasattr(post, 'freshness')
            assert hasattr(post, 'community_relevance')
            assert hasattr(post, 'score')
            assert post.user_vote is not None

    def test_get_user_recommendations_excludes_liked_posts(self, authenticated_client, test_user, post, community):
        cache.clear()

        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(
            reverse('post-recommendations')).wsgi_request
        request.user = test_user
        queryset = get_user_recommendations(request)

        assert post.id not in queryset.values_list('id', flat=True)

    def test_get_trending_posts(self, api_client, post):
        cache.clear()

        post.created = timezone.now() - timedelta(hours=1)
        post.save()

        request = api_client.get(reverse('post-recommendations')).wsgi_request
        queryset = get_trending_posts(days=3)

        assert queryset.count() >= 1
        assert post.id in queryset.values_list('id', flat=True)
        for post in queryset:
            assert hasattr(post, 'sum_rating')
            assert hasattr(post, 'comment_count')
            assert hasattr(post, 'score')

    def test_get_trending_posts_excludes_old_posts(self, api_client, post):
        cache.clear()

        post.created = timezone.now() - timedelta(days=10)
        post.save()

        request = api_client.get(reverse('post-recommendations')).wsgi_request
        queryset = get_trending_posts(days=3)

        assert post.id not in queryset.values_list('id', flat=True)

    def test_get_annotated_ratings_authenticated(self, authenticated_client, test_user, post):
        cache.clear()

        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(
            reverse('post-recommendations')).wsgi_request
        request.user = test_user
        queryset = get_annotated_ratings(
            Post.objects.all(), request, post_content_type)

        post = queryset.get(id=post.id)
        assert post.sum_rating == 1
        assert post.user_vote == 1

    def test_get_annotated_ratings_unauthenticated(self, api_client, post):
        cache.clear()

        post_content_type = ContentType.objects.get_for_model(Post)
        request = api_client.get(reverse('post-recommendations')).wsgi_request
        queryset = get_annotated_ratings(
            Post.objects.all(), request, post_content_type)

        post = queryset.get(id=post.id)
        assert post.sum_rating == 0
        assert post.user_vote == 0

    def test_get_optimized_post_queryset(self, authenticated_client, test_user, post, comment, media_file):
        cache.clear()

        request = authenticated_client.get(
            reverse('post-recommendations')).wsgi_request
        request.user = test_user
        queryset = get_optimized_post_queryset(request)

        post = queryset.get(id=post.id)
        assert hasattr(post, 'sum_rating')
        assert hasattr(post, 'user_vote')
        assert hasattr(post, 'comment_count')
        assert post.comment_count == 1
        assert post.media_data.count() == 1

    def test_post_list_pagination(self, authenticated_client, test_user, community):
        cache.clear()

        for i in range(30):
            Post.objects.create(
                author=test_user,
                title=f'testpost_{i}',
                community=community,
                status='PB'
            )

        response = authenticated_client.get(reverse('post-recommendations'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 25
        assert 'next_cursor' in response.data

    def test_post_list_unauthenticated_trending_with_task(self, api_client, post):
        cache.clear()

        post.created = timezone.now() - timedelta(hours=1)
        post.status = 'PB'
        post.sum_rating = 10
        post.comment_count = 5
        post.save()

        update_posts_score()

        post.refresh_from_db()
        assert post.score > 0

        response = api_client.get(reverse('post-recommendations'))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1


@pytest.mark.django_db
class TestCommunityRecommendationsView:

    def test_recommendations_unauthenticated_structure(self, api_client, community_python):
        url = reverse('community-recommendations')
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'unauthenticated_recommendations'
        assert 'recommendations' in response.data
        assert 'next' in response.data

    def test_recommendations_ordering_by_score(self, authenticated_client, test_user,
                                               category_python, community_python, community_django):
        """
        Sorting check: Django (score=100) must be higher than Python (score=50),
        even if members_count is less.
        """
        subscribed_comm = Community.objects.create(
            creator=test_user, name='Sub', slug='sub', members_count=1
        )
        subscribed_comm.categories.add(category_python)
        Membership.objects.create(user=test_user, community=subscribed_comm)

        url = reverse('community-recommendations')
        response = authenticated_client.get(url)

        recs = response.data['recommendations']
        assert len(recs) >= 2

        assert recs[0]['slug'] == community_django.slug
        assert recs[1]['slug'] == community_python.slug

    def test_caching_for_unauthenticated_user(self, api_client, community_python):
        url = reverse('community-recommendations')

        response1 = api_client.get(url)
        assert response1.status_code == 200

        assert cache.get('unauth_recs:initial') is not None

        community_python.delete()

        response2 = api_client.get(url)
        slugs = [r['slug'] for r in response2.data['recommendations']]
        assert 'python-fans' in slugs

    def test_caching_for_authenticated_user_first_page(self, authenticated_client, test_user, community_python):
        url = reverse('community-recommendations')

        authenticated_client.get(url)

        cache_key = f'auth_recs_first_page:{test_user.id}'
        assert cache.get(cache_key) is not None

    def test_cache_invalidation_on_subscribe(self, authenticated_client, test_user, community_python):
        url_recs = reverse('community-recommendations')

        authenticated_client.get(url_recs)
        cache_key = f'auth_recs_first_page:{test_user.id}'
        assert cache.get(cache_key) is not None

        Membership.objects.create(user=test_user, community=community_python)

        assert cache.get(cache_key) is None

    def test_cold_start_fallback(self, authenticated_client, second_user, community_gaming):
        url = reverse('community-recommendations')
        response = authenticated_client.get(url)

        assert response.data['type'] == 'just_popular_communities'
        recs = response.data['recommendations']
        assert recs[0]['slug'] == community_gaming.slug

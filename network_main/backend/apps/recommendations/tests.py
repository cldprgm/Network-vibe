import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.core.cache import cache

from apps.users.models import CustomUser
from apps.categories.models import Category
from apps.communities.models import Community
from apps.memberships.models import Membership


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

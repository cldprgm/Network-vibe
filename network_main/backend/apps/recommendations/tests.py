import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.categories.models import Category
from apps.communities.models import Community
from apps.memberships.models import Membership
from apps.posts.models import Post


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
def test_user_creator():
    return CustomUser.objects.create_user(
        username='testuserCr',
        email='testCr@example.com',
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
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    return api_client


@pytest.fixture
def authenticated_client_creator(api_client, test_user_creator):
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'testCr@example.com',
        'password': 'testpassword'
    })
    return api_client


@pytest.fixture
def category_python():
    return Category.objects.create(title='Python', slug='python')


@pytest.fixture
def category_gaming():
    return Category.objects.create(title='Gaming', slug='gaming')


@pytest.fixture
def community_python(test_user_creator, category_python):
    community = Community.objects.create(
        creator=test_user_creator,
        name='Python Fans',
        slug='python-fans'
    )
    community.categories.add(category_python)
    return community


# community that should be recommended
@pytest.fixture
def community_django(second_user, category_python):
    community = Community.objects.create(
        creator=second_user,
        name='Django Ninjas',
        slug='django-ninjas'
    )
    community.categories.add(category_python)
    return community


# community from another category that should not be recommended
@pytest.fixture
def community_gaming(second_user, category_gaming):
    community = Community.objects.create(
        creator=second_user,
        name='Gamers United',
        slug='gamers-united'
    )
    community.categories.add(category_gaming)
    return community


@pytest.fixture
def popular_community(test_user_creator, category_gaming):
    community = Community.objects.create(
        creator=test_user_creator,
        name='Popular Community',
        slug='popular-community'
    )
    community.categories.add(category_gaming)
    return community


@pytest.mark.django_db
class TestCommunityRecommendationsView:
    def test_recommendations_unauthenticated(self, api_client):
        url = reverse('community-recommendations')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'unauthenticated_recommendations'

    def test_recommendations_for_new_user_cold_start(self, authenticated_client, popular_community, second_user, test_user_creator):
        Membership.objects.create(
            user=second_user, community=popular_community)

        url = reverse('community-recommendations')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'just_popular_communities'

        recommendations = response.data['recommendations']
        assert len(recommendations) > 0

        popular_community_in_response = any(
            rec['slug'] == popular_community.slug for rec in recommendations
        )
        assert popular_community_in_response is True

    def test_recommendations_for_user_with_subscriptions(self, authenticated_client, test_user, community_python, community_django, community_gaming):
        Membership.objects.create(user=test_user, community=community_python)

        url = reverse('community-recommendations')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'recommended_communities'

        recommendations = response.data['recommendations']
        recommended_slugs = {rec['slug'] for rec in recommendations}

        assert community_django.slug in recommended_slugs
        assert community_python.slug not in recommended_slugs
        assert community_gaming.slug not in recommended_slugs

    def test_recommendations_when_no_new_communities_to_recommend(self, authenticated_client, test_user, community_python, community_django):
        Membership.objects.create(user=test_user, community=community_python)
        Membership.objects.create(user=test_user, community=community_django)

        url = reverse('community-recommendations')
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['type'] == 'recommended_communities'

        recommendations = response.data['recommendations']
        assert len(recommendations) == 0

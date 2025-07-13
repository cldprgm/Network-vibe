import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.models import CustomUser
from apps.communities.models import Community
from apps.categories.models import Category


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return CustomUser.objects.create_user(
        username='user1',
        email='user1@example.com',
        password='pass'
    )


@pytest.fixture
def authenticated_client(api_client, test_user):
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'user1@example.com',
        'password': 'pass'
    })
    return api_client


@pytest.fixture
def parent_category():
    return Category.objects.create(title='Parent Category')


@pytest.fixture
def child_category(parent_category):
    return Category.objects.create(title='Child Category', parent=parent_category)


@pytest.fixture
def community(test_user, child_category):
    community = Community.objects.create(
        creator=test_user,
        name='comm1',
        slug='comm1',
        description='desc',
    )
    community.categories.add(child_category)
    return community


@pytest.mark.django_db
class TestCategoryViewSet:
    def test_list_categories(self, api_client, parent_category, child_category):
        url = reverse('category-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        results = response.data['results']
        assert len(results) == 1
        parent = results[0]
        assert parent['id'] == parent_category.id

        subs = parent['subcategories']
        assert isinstance(subs, list)
        assert len(subs) == 1
        sub = subs[0]
        assert sub['id'] == child_category.id


@pytest.mark.django_db
class TestCategoryCommunityListView:
    def test_list_communities(self, api_client,  parent_category, child_category, community):
        url = reverse(
            'subcategory-communities',
            kwargs={'subcategory_id': child_category.id}
        )
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['results'][0]['id'] == community.id

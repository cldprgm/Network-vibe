import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse

from apps.communities.models import Community
from apps.users.models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return CustomUser.objects.create_user(
        username='creator test user',
        email='creator@example.com',
        password='password',
        is_active=True
    )


@pytest.fixture
def create_users():
    CustomUser.objects.create_user(
        username='main test user', email='testuser@example.com', password='password', is_active=True)
    CustomUser.objects.create_user(
        username='search_user', email='search_user@example.com', password='password', is_active=True)
    CustomUser.objects.create_user(
        username='another', email='another@example.com', password='password', is_active=True)


@pytest.fixture
def create_communities(test_user):
    Community.objects.create(
        creator=test_user, name='Test_Community', slug='test_community')
    Community.objects.create(
        creator=test_user, name='Search_Community', slug='search_community')
    Community.objects.create(
        creator=test_user, name='Awesome_Community', slug='awesome_community')


@pytest.mark.django_db
class TestSearchView:
    def test_search_with_empty_query_param_fails(self, api_client):
        url = reverse('search')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'parameter cannot be empty'

    def test_search_finds_communities_and_users(self, api_client, test_user, create_users, create_communities):
        url = reverse('search') + '?q=test'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        results = response.data

        assert len(results) == 3

        types = {item['type'] for item in results}
        assert 'user' in types
        assert 'community' in types

        titles = set()
        for item in results:
            if item['type'] == 'community':
                titles.add(item['name'])
            elif item['type'] == 'user':
                titles.add(item['username'])

        assert 'creator test user' in titles
        assert 'main test user' in titles
        assert 'Test_Community' in titles

    def test_search_finds_only_communities(self, api_client, test_user, create_communities):
        url = reverse('search') + '?q=Awesome'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        results = response.data
        assert len(results) == 1
        assert results[0]['type'] == 'community'
        assert results[0]['name'] == 'Awesome_Community'

    def test_search_finds_only_users(self, api_client, create_users):
        url = reverse('search') + '?q=another'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        results = response.data
        assert len(results) == 1
        assert results[0]['type'] == 'user'
        assert results[0]['username'] == 'another'

    def test_search_with_no_results(self, api_client, test_user, create_users, create_communities):
        url = reverse('search') + '?q=nonexistentquery'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_search_result_limit(self, api_client, test_user):
        for i in range(12):
            Community.objects.create(
                creator=test_user, name=f'limit test {i}', slug=f'limit-test-{i}')

        url = reverse('search') + '?q=limit'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 10

    def test_search_results_are_ranked(self, api_client, test_user):
        Community.objects.create(
            creator=test_user, name='test_awda_awda', slug='test_awda_awda')
        Community.objects.create(
            creator=test_user, name='awda_awdadwad_test', slug='awda_awdadwad_test')
        CustomUser.objects.create_user(
            username='test_dev', email='test@dev.com', password='password')

        url = reverse('search') + '?q=Test'
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 4
        for item in response.data:
            print(item)

        assert all('rank' in item for item in response.data)

        ranks = [item['rank'] for item in response.data]
        assert ranks == sorted(ranks, reverse=True)

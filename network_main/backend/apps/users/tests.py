import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return CustomUser.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpassword'
    )


@pytest.fixture
def authenticated_client(api_client, test_user):
    login_url = reverse('login')
    response = api_client.post(login_url, {
        'email': 'test@example.com',
        'password': 'testpassword'
    })

    client = APIClient()
    client.cookies = response.cookies
    return client


@pytest.mark.django_db
class TestUserRegistration:
    url = reverse('register')

    def test_successful_registration(self, api_client):
        data = {
            'username': 'testuser2',
            'email': 'test2@example.com',
            'password': 'testpassword2'
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert CustomUser.objects.filter(email='test2@example.com').exists()

    def test_missing_fields(self, api_client):
        data = {'email': 'incomplete@example.com'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
@pytest.mark.usefixtures('test_user')
class TestUserLogin:
    url = reverse('login')

    def test_successful_login(self, api_client):
        data = {
            'email': 'test@example.com',
            'password': 'testpassword'
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies
        assert 'user' in response.data

    def test_invalid_credentials(self, api_client):
        data = {
            'email': 'invalid@example.com',
            'password': 'invalidpassword'
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestCustomUserView:
    url = reverse('user-info')

    def test_get_user_info_unauthenticated(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_user_info_authenticated(self, authenticated_client):
        response = authenticated_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['email'] == 'test@example.com'

    def test_update_user_info(self, authenticated_client, test_user):
        data = {'first_name': 'testupdate'}
        response = authenticated_client.patch(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        test_user.refresh_from_db()
        assert test_user.first_name == 'testupdate'

    def test_update_other_user(self, api_client, test_user):
        other_user = CustomUser.objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='otherpassword'
        )

        login_url = reverse('login')
        response = api_client.post(login_url, {
            'email': 'other@example.com',
            'password': 'otherpassword'
        })
        client = APIClient()
        client.cookies = response.cookies

        data = {'username': 'hacked'}
        response = client.patch(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        test_user.refresh_from_db()
        assert test_user.username == 'testuser'


@pytest.mark.django_db
class TestUserLogout:
    url = reverse('logout')

    def test_logout(self, authenticated_client):
        response = authenticated_client.post(self.url)

        assert response.status_code == status.HTTP_200_OK
        assert response.cookies['access_token'].value == ''
        assert response.cookies['refresh_token'].value == ''


@pytest.mark.django_db
class TestRefreshToken:
    url = reverse('refresh')

    def test_refresh_success(self, authenticated_client):
        response = authenticated_client.post(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.cookies
        assert response.cookies['access_token'] != ''

    def test_refresh_Invalid_token(self):
        client = APIClient()
        client.cookies['refresh_token'] = 'invalidtoken'
        response = client.post(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_missing_token(self, api_client):
        response = api_client.post(self.url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

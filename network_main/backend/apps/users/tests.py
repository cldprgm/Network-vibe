import pytest
from datetime import timedelta
import os
from PIL import Image
import io
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from .models import CustomUser, VerificationCode


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
        user = CustomUser.objects.get(email='test2@example.com')
        assert user.is_active is False
        assert VerificationCode.objects.filter(user=user).exists()

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

    def test_inactive_user(self, api_client):
        inactive_user = CustomUser.objects.create_user(
            username='inactiveuser',
            email='inactive@example.com',
            password='inactivepassword',
            is_active=False
        )
        data = {
            'email': 'inactive@example.com',
            'password': 'inactivepassword'
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
            password='otherpassword',
            is_active=True
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

    def test_update_valid_avatar(self, authenticated_client, test_user):
        w, h = 100, 100
        random_bytes = os.urandom(w * h * 3)
        img = Image.frombytes('RGB', (w, h), random_bytes)
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='JPEG', quality=100)
        valid_image = SimpleUploadedFile(
            name='test.jpg',
            content=img_byte_arr.getvalue(),
            content_type='image/jpeg'
        )
        data = {'avatar': valid_image}
        response = authenticated_client.patch(
            self.url, data, format='multipart')
        assert response.status_code == status.HTTP_200_OK
        test_user.refresh_from_db()
        assert test_user.avatar
        test_user.avatar.delete()

    def test_update_avatar_too_large(self, authenticated_client, test_user):
        large_content = b'0' * (5 * 1024 * 1024 + 1)
        large_image = SimpleUploadedFile(
            name='large.jpg',
            content=large_content,
            content_type='image/jpeg'

        )
        data = {'avatar': large_image}
        response = authenticated_client.patch(
            self.url, data, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'avatar' in response.data

    def test_update_invalid_mime_type_avatar(self, authenticated_client, test_user):
        invalid_file = SimpleUploadedFile(
            name='test.txt',
            content=b'text_content',
            content_type='text/plain'
        )
        data = {'avatar': invalid_file}
        response = authenticated_client.patch(
            self.url, data, format='multipart')
        assert response.status_code == status.HTTP_400_BAD_REQUEST


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


@pytest.mark.django_db
class TestVerifyCode:
    url = reverse('verify_code')

    def test_successful_verification(self, api_client):
        user = CustomUser.objects.create_user(
            username='verifyuser',
            email='verify@example.com',
            password='verifypassword',
            is_active=False
        )
        code = VerificationCode.generate_for_user(user)
        data = {
            'email': 'verify@example.com',
            'code': code
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_201_CREATED
        user.refresh_from_db()
        assert user.is_active is True
        assert not VerificationCode.objects.filter(user=user).exists()

    def test_invalid_code(self, api_client):
        user = CustomUser.objects.create_user(
            username='invalidcodeuser',
            email='invalidcode@example.com',
            password='invalidcodepassword',
            is_active=False
        )
        VerificationCode.generate_for_user(user)
        data = {
            'email': 'invalidcode@example.com',
            'code': 'wrongcode'
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_expired_code(self, api_client):
        user = CustomUser.objects.create_user(
            username='expireduser',
            email='expired@example.com',
            password='expiredpassword',
            is_active=False
        )
        code = VerificationCode.generate_for_user(user)
        verification_code = VerificationCode.objects.get(user=user)
        verification_code.expired_at = timezone.now() - timedelta(minutes=1)
        verification_code.save()
        data = {
            'email': 'expired@example.com',
            'code': code
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_fields(self, api_client):
        data = {'email': 'missing@example.com'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestResendVerification:
    url = reverse('resend_code')

    def test_resend_for_inactive_user(self, api_client):
        user = CustomUser.objects.create_user(
            username='resenduser',
            email='resend@example.com',
            password='resendpassword',
            is_active=False
        )
        old_code = VerificationCode.generate_for_user(user)
        data = {'email': 'resend@example.com'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert not VerificationCode.objects.filter(code=old_code).exists()
        assert VerificationCode.objects.filter(user=user).exists()

    def test_resend_for_non_existing_email(self, api_client):
        data = {'email': 'nonexisting@example.com'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK

    def test_resend_for_active_user(self, api_client):
        user = CustomUser.objects.create_user(
            username='activeuser',
            email='active@example.com',
            password='activepassword',
            is_active=True
        )
        data = {'email': 'active@example.com'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_200_OK
        assert not VerificationCode.objects.filter(user=user).exists()

    def test_missing_email(self, api_client):
        data = {}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

import pytest
import os
import io
import jwt

from datetime import timedelta
from PIL import Image

from unittest.mock import Mock

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.cache import cache
from django.utils import timezone
from django.urls import reverse
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.test import APIClient
from rest_framework.exceptions import ErrorDetail

from apps.communities.models import Community
from apps.memberships.models import Membership
from apps.posts.models import Post
from .models import CustomUser


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_user():
    return CustomUser.objects.create_user(
        username='testuser',
        slug='testuser',
        email='test@example.com',
        password='testpassword',
        is_active=True
    )


@pytest.fixture
def another_user():
    return CustomUser.objects.create_user(
        username='anotheruser',
        slug='anotheruser',
        email='another@example.com',
        password='anotherpassword',
        is_active=True
    )


@pytest.fixture
def user_with_no_posts():
    return CustomUser.objects.create_user(
        username='nopostsuser',
        slug='nopostsuser',
        email='noposts@example.com',
        password='nopostspassword',
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
class TestGoogleLogin:
    url = reverse('google_login')

    def test_missing_code(self, api_client):
        data = {}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'code' in response.data

    def test_google_upstream_error(self, api_client, mocker):
        mocker.patch('apps.users.views.get_google_tokens',
                     side_effect=Exception("Failed to exchange code with Google"))

        data = {'code': 'invalid_code'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == "Failed to exchange code with Google"

    def test_google_no_id_token(self, api_client, mocker):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'access_token': 'some_token'
        }

        mocker.patch('apps.services.oauth_tokens.requests.post',
                     return_value=mock_response)

        data = {'code': 'valid_code'}
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

        assert response.data['error'] == "[ErrorDetail(string='No ID token provided', code='invalid')]"

    def test_successful_login_new_user(self, api_client, mocker):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id_token': 'dummy_id_token'}
        mocker.patch('apps.users.views.requests.post',
                     return_value=mock_response)

        google_payload = {
            'email': 'new_google@example.com',
            'sub': '1234567890',
            'name': 'New Google User',
            'given_name': 'New',
            'family_name': 'User',
            'picture': 'http://example.com/avatar.jpg'
        }
        mocker.patch('apps.users.views.jwt.decode',
                     return_value=google_payload)

        data = {'code': 'valid_code_new_user'}
        response = api_client.post(self.url, data)

        assert response.status_code == status.HTTP_200_OK

        user = CustomUser.objects.get(email='new_google@example.com')
        assert user.google_id == '1234567890'
        assert user.first_name == 'New'
        assert user.is_active is True

        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies

    def test_successful_login_existing_user_by_google_id(self, api_client, mocker):
        existing_user = CustomUser.objects.create_user(
            username='googleuser',
            email='old_email@example.com',
            password='password',
            google_id='9876543210'
        )

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id_token': 'dummy_id_token'}
        mocker.patch('apps.services.oauth_tokens.requests.post',
                     return_value=mock_response)

        google_payload = {
            'email': 'actual_google_email@example.com',
            'sub': '9876543210',
            'name': 'Google User'
        }
        mocker.patch('apps.users.views.jwt.decode',
                     return_value=google_payload)

        data = {'code': 'valid_code_existing'}
        response = api_client.post(self.url, data)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['user']['email'] == existing_user.email

    def test_successful_login_link_by_email(self, api_client, mocker):
        user = CustomUser.objects.create_user(
            username='emailuser',
            email='link@example.com',
            password='password'
        )
        assert user.google_id is None

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id_token': 'dummy_id_token'}
        mocker.patch('apps.users.views.requests.post',
                     return_value=mock_response)

        google_payload = {
            'email': 'link@example.com',
            'sub': '111222333',
            'name': 'Linked User'
        }
        mocker.patch('apps.users.views.jwt.decode',
                     return_value=google_payload)

        data = {'code': 'valid_code_link'}
        response = api_client.post(self.url, data)

        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.google_id == '111222333'

    def test_jwt_decode_error(self, api_client, mocker):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id_token': 'bad_token'}
        mocker.patch('apps.users.views.requests.post',
                     return_value=mock_response)

        mocker.patch('apps.users.views.jwt.decode', side_effect=jwt.PyJWTError)

        data = {'code': 'code_bad_token'}
        response = api_client.post(self.url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'Invalid ID token'

    def test_incomplete_google_data(self, api_client, mocker):
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'id_token': 'dummy_token'}
        mocker.patch('apps.users.views.requests.post',
                     return_value=mock_response)

        google_payload = {
            'sub': '12345',
            'name': 'No Email User'
        }
        mocker.patch('apps.users.views.jwt.decode',
                     return_value=google_payload)

        data = {'code': 'code_incomplete'}
        response = api_client.post(self.url, data)

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == "Incomplete data from Google"


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
class TestVerifyEmail:

    def test_successful_verification(self, api_client):
        user = CustomUser.objects.create_user(
            username='verifyuser',
            email='verify@example.com',
            password='verifypassword',
            is_active=False
        )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        url = reverse('verify_email', kwargs={'uidb64': uid, 'token': token})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        user.refresh_from_db()
        assert user.is_active is True

        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies

    def test_invalid_token(self, api_client):
        user = CustomUser.objects.create_user(
            username='invalidtokenuser',
            email='invalidtoken@example.com',
            password='testpassword',
            is_active=False
        )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = 'some-invalid-token'

        url = reverse('verify_email', kwargs={'uidb64': uid, 'token': token})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        user.refresh_from_db()
        assert user.is_active is False

    def test_invalid_uid(self, api_client):
        user = CustomUser.objects.create_user(
            username='invaliduiduser',
            email='invaliduid@example.com',
            password='testpassword',
            is_active=False
        )

        uid = 'invalid-uid'
        token = default_token_generator.make_token(user)

        url = reverse('verify_email', kwargs={'uidb64': uid, 'token': token})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_400_BAD_REQUEST

        user.refresh_from_db()
        assert user.is_active is False

    def test_already_active_user(self, api_client):
        user = CustomUser.objects.create_user(
            username='activeuser',
            email='active@example.com',
            password='testpassword',
            is_active=True
        )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        url = reverse('verify_email', kwargs={'uidb64': uid, 'token': token})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'access_token' in response.cookies
        assert 'refresh_token' in response.cookies

        user.refresh_from_db()
        assert user.is_active is True


@pytest.mark.django_db
class TestCustomUserCommunitiesView:

    @pytest.fixture(autouse=True)
    def setup_method(self, db, test_user, another_user):
        self.target_user = test_user
        self.creator_user = another_user

        self.community1 = Community.objects.create(
            name='Community 1', creator=self.creator_user)
        self.community2 = Community.objects.create(
            name='Community 2', creator=self.creator_user)
        self.community3 = Community.objects.create(
            name='Community 3', creator=self.target_user)

        Membership.objects.create(
            user=self.target_user, community=self.community1)
        Membership.objects.create(
            user=self.target_user, community=self.community2)

        cache.clear()

    def test_get_user_communities_success(self, api_client, test_user):
        url = reverse('user_communities', kwargs={'slug': test_user.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2
        community_names = {item['name'] for item in response.data['results']}
        assert 'Community 1' in community_names
        assert 'Community 2' in community_names
        assert 'Community 3' not in community_names

    def test_get_user_communities_not_found(self, api_client):
        url = reverse('user_communities', kwargs={'slug': 'non-existent-slug'})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_user_has_no_communities(self, api_client, another_user):
        url = reverse('user_communities', kwargs={'slug': another_user.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0

    def test_pagination_works(self, api_client, test_user):
        for i in range(15):
            community = Community.objects.create(
                name=f'Pag-Comm-{i}', creator=self.creator_user)
            Membership.objects.create(user=test_user, community=community)

        url = reverse('user_communities', kwargs={'slug': test_user.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'next' in response.data
        assert response.data['next'] is not None
        assert 'results' in response.data
        next_url = response.data['next']
        response_next = api_client.get(next_url)
        assert response_next.status_code == status.HTTP_200_OK
        assert len(response_next.data['results']) > 0

    def test_caching_first_page(self, api_client, test_user):
        slug = test_user.slug
        url = reverse('user_communities', kwargs={'slug': slug})
        cache_key = f'user_communities_first_page:{slug}'

        assert cache.get(cache_key) is None

        response1 = api_client.get(url)
        assert response1.status_code == status.HTTP_200_OK

        cached_data = cache.get(cache_key)
        assert cached_data is not None
        assert cached_data == response1.data

    def test_caching_is_not_used_for_paginated_pages(self, api_client, test_user):
        slug = test_user.slug
        url = reverse('user_communities', kwargs={'slug': slug})
        paginated_url = f"{url}?cursor=somecursorvalue"
        cache_key = f'user_communities_first_page:{slug}'

        api_client.get(paginated_url)

        assert cache.get(cache_key) is None


@pytest.mark.django_db
class TestCustomUserPostsView:

    @pytest.fixture(autouse=True)
    def setup_method(self, db, test_user, another_user):
        self.target_user = test_user
        self.another_user = another_user
        self.community = Community.objects.create(
            name='Test Community', creator=self.another_user)

        self.post_oldest = Post.objects.create(
            author=self.target_user, community=self.community, title='Oldest Post', status='PB')
        self.post_oldest.created = timezone.now() - timedelta(days=2)
        self.post_oldest.save()

        self.post_middle = Post.objects.create(
            author=self.target_user, community=self.community, title='Middle Post', status='PB')
        self.post_middle.created = timezone.now() - timedelta(days=1)
        self.post_middle.save()

        self.post_second_newest = Post.objects.create(
            author=self.target_user, community=self.community, title='Second Newest Post', status='PB')

        self.post_newest = Post.objects.create(
            author=self.target_user, community=self.community, title='Newest Post', status='PB')

        self.other_user_post = Post.objects.create(
            author=self.another_user, community=self.community, title='Another User Post', status='PB')

        self.post_draft = Post.objects.create(
            author=self.target_user, community=self.community, title='Draft Post', status='DF')

        cache.clear()

    def test_get_user_posts_success_popular_filter(self, api_client):
        url = reverse('user_posts', kwargs={'slug': self.target_user.slug})
        response = api_client.get(url, {'filter': 'popular'})

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) == 4

    def test_get_user_posts_success_new_filter(self, api_client):
        url = reverse('user_posts', kwargs={'slug': self.target_user.slug})
        response = api_client.get(url, {'filter': 'new'})

        assert response.status_code == status.HTTP_200_OK
        results = response.data['results']
        assert len(results) == 4

        assert results[0]['title'] == self.post_newest.title
        assert results[1]['title'] == self.post_second_newest.title
        assert results[2]['title'] == self.post_middle.title
        assert results[3]['title'] == self.post_oldest.title

    def test_draft_posts_are_not_included(self, api_client):
        url = reverse('user_posts', kwargs={'slug': self.target_user.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 4

        post_titles = [post['title'] for post in response.data['results']]
        assert self.post_draft.title not in post_titles

    def test_user_with_no_posts(self, api_client, user_with_no_posts):
        url = reverse('user_posts', kwargs={'slug': user_with_no_posts.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0

    def test_get_user_posts_user_not_found(self, api_client):
        url = reverse('user_posts', kwargs={'slug': 'non-existent-slug'})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0

    def test_pagination_works_for_posts(self, api_client):
        for i in range(22):
            Post.objects.create(
                author=self.target_user, community=self.community, title=f'Pag Post {i}', status='PB')

        url = reverse('user_posts', kwargs={'slug': self.target_user.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 25
        assert response.data['next'] is not None

        next_page_url = response.data['next']
        next_response = api_client.get(next_page_url)
        assert next_response.status_code == status.HTTP_200_OK
        assert len(next_response.data['results']) == 1

    def test_caching_works_for_first_page_popular(self, api_client):
        slug = self.target_user.slug
        url = reverse('user_posts', kwargs={'slug': slug})
        cache_key = f"user_posts_first_page:{slug}:popular"
        assert cache.get(cache_key) is None
        response = api_client.get(url, {'filter': 'popular'})
        assert response.status_code == status.HTTP_200_OK
        cached_response_data = cache.get(cache_key)
        assert cached_response_data is not None
        assert cached_response_data == response.data

    def test_caching_works_for_first_page_new(self, api_client):
        slug = self.target_user.slug
        url = reverse('user_posts', kwargs={'slug': slug})
        cache_key = f"user_posts_first_page:{slug}:new"
        assert cache.get(cache_key) is None
        response = api_client.get(url, {'filter': 'new'})
        assert response.status_code == status.HTTP_200_OK
        cached_response_data = cache.get(cache_key)
        assert cached_response_data is not None
        assert cached_response_data == response.data

    def test_caching_is_not_used_for_paginated_pages_for_posts(self, api_client):
        slug = self.target_user.slug
        url = reverse('user_posts', kwargs={'slug': slug})
        cache_key_popular = f"user_posts_first_page:{slug}:popular"
        api_client.get(url, {'cursor': 'randomcursorvalue'})
        assert cache.get(cache_key_popular) is None

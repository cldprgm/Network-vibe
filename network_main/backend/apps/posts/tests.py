import pytest
from django.urls import reverse
from django.contrib.contenttypes.models import ContentType

from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import CustomUser
from apps.communities.models import Community
from apps.categories.models import Category
from apps.ratings.models import Rating
from apps.posts.models import Post, Comment, Media


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
        community=community
    )


@pytest.mark.django_db
class TestPostView:
    url = reverse('post-list')

    def test_list_posts(self, api_client, post):
        response = api_client.get(self.url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'testpost'

    def test_create_post(self, authenticated_client, community):
        data = {
            'author': authenticated_client,
            'title': 'newtestpost',
            'community_obj': community.id
        }
        response = authenticated_client.post(self.url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Post.objects.filter(title='newtestpost').exists()

    def test_retrieve_post(self, api_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'testpost'

    def test_update_post(self, authenticated_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        data = {'title': 'new title'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        post.refresh_from_db()
        assert post.title == 'new title'

    def test_delete_post(self, authenticated_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Post.objects.filter(id=post.id).exists()

    def test_post_ratings_get(self, api_client, post):
        url = reverse('post-ratings', kwargs={'slug': 'testpost'})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'user_vote' in response.data
        assert 'sum_rating' in response.data

    def test_post_ratings_create(self, authenticated_client, test_user, post):
        url = reverse('post-ratings', kwargs={'slug': post.slug})
        data = {'value': 1}
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Rating.objects.filter(
            content_type__model='post',
            object_id=post.id,
            user=test_user
        ).exists()

    def test_post_rating_delete(self, authenticated_client, test_user, post):
        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Post),
            object_id=post.id,
            user=test_user,
            ip_address='192.168.0.1',
            value=1
        )

        url = reverse('post-ratings', kwargs={'slug': post.slug})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert not Rating.objects.filter(
            content_type__model='post',
            object_id=post.id,
            user=test_user
        ).exists()

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
        password='testpassword'
    )


@pytest.fixture
def second_user():
    return CustomUser.objects.create_user(
        username='seconduser',
        email='second@example.com',
        password='secondpassword'
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
        description='desc',
    )
    community.categories.add(category)
    return community


@pytest.fixture
def post(test_user, community):
    return Post.objects.create(
        title='testpost',
        author=test_user,
        community=community
    )


@pytest.fixture
def membership(test_user, community):
    return Membership.objects.create(
        user=test_user,
        community=community,
        is_approved=True
    )


@pytest.mark.django_db
class TestCommunityViewSet():
    def test_list_communities(self, api_client, community):
        url = reverse('community-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['name'] == community.name

    def test_retrieve_community(self, api_client, community):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['name'] == community.name

    def test_create_community(self, authenticated_client, category):
        url = reverse('community-list')
        data = {
            'name': 'newcommunity',
            'slug': 'newcommunity',
            'description': 'newdesc',
            'categories': category
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Community.objects.filter(slug='newcommunity').exists()

    def test_create_community_unauthenticated(self, api_client, category):
        url = reverse('community-list')
        data = {
            'name': 'newcommunity',
            'slug': 'newcommunity',
            'description': 'newdesc',
            'categories': category
        }
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Community.objects.filter(slug='newcommunity').exists()

    def test_update_community_owner(self, authenticated_client, community):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        data = {'description': 'updated'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        community.refresh_from_db()
        assert community.description == 'updated'

    def test_update_community_not_owner(self, second_user, community, api_client):
        login_url = reverse('login')
        api_client.post(login_url, {
            'email': 'second@example.com',
            'password': 'secondpassword'
        })
        client2 = APIClient()
        client2.cookies = api_client.cookies

        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = client2.patch(url, {'description': 'updated'})
        assert response.status_code == status.HTTP_403_FORBIDDEN
        community.refresh_from_db()
        assert community.description != 'updated'

    def test_delete_community_owner(self, authenticated_client, community):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Community.objects.filter(pk=community.pk).exists()

    def test_delete_community_not_authenticated(self, api_client, community):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Community.objects.filter(pk=community.pk).exists()


@pytest.mark.django_db
class TestCommunityPostsListView():

    def test_list_community_posts(self, api_client, community, post):
        url = reverse('community-posts-list',
                      kwargs={'community_slug': community.slug})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['id'] == post.id
        assert response.data['results'][0]['community_id'] == community.id


@pytest.mark.django_db
class TestMembershipViewSet():
    def test_join_community(self, authenticated_client, test_user, community):
        url = reverse(
            'community-members-list',
            kwargs={'community_pk': community.pk}
        )
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_201_CREATED
        assert Membership.objects.filter(
            user=test_user, community=community).exists

    def test_join_community_unauthenticated(self, api_client, community):
        url = reverse(
            'community-members-list',
            kwargs={'community_pk': community.pk}
        )
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Membership.objects.filter(community=community).exists()

    def test_leave_community(self, authenticated_client, membership, community):
        url = reverse(
            'community-members-leave',
            kwargs={'community_pk': community.id}
        )
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(id=membership.id).exists()

    def test_leave_community_not_member(self, authenticated_client, community):
        url = reverse(
            'community-members-leave',
            kwargs={'community_pk': community.id}
        )
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_destroy_membership(self, authenticated_client, membership, community):
        url = reverse('community-members-detail', kwargs={
            'community_pk': community.id,
            'pk': membership.id
        })
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(id=membership.id).exists()

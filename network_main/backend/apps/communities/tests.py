import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile

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
def test_user_creator():
    return CustomUser.objects.create_user(
        username='testuserCr',
        email='testCr@example.com',
        password='testpassword'
    )


@pytest.fixture
def test_user_moderator():
    return CustomUser.objects.create_user(
        username='testuserModerator',
        email='testModerato@example.com',
        password='testpassword'
    )


@pytest.fixture
def test_user_member():
    return CustomUser.objects.create_user(
        username='testuserMember',
        email='testMember@example.com',
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
def authenticated_client_creator(api_client, test_user_creator):
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'testCr@example.com',
        'password': 'testpassword'
    })
    return api_client


@pytest.fixture
def authenticated_client_moderator(api_client, test_user_moderator):
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'testModerato@example.com',
        'password': 'testpassword'
    })
    return api_client


@pytest.fixture
def authenticated_client_member(api_client, test_user_member):
    login_url = reverse('login')
    api_client.post(login_url, {
        'email': 'testMember@example.com',
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
def community(test_user_creator, category):
    community = Community.objects.create(
        creator=test_user_creator,
        name='testcommunity',
        slug='testcommunity',
        description='desc',
    )
    community.categories.add(category)
    return community


@pytest.fixture
def post(test_user_creator, community):
    return Post.objects.create(
        title='testpost',
        author=test_user_creator,
        community=community
    )


@pytest.fixture
def membership_creator(test_user_creator, community):
    return Membership.objects.create(
        user=test_user_creator,
        community=community,
        role=Membership.Role.CREATOR
    )


@pytest.fixture
def membership_moderator(test_user_moderator, community):
    return Membership.objects.create(
        user=test_user_moderator,
        community=community,
        role=Membership.Role.MODERATOR
    )


@pytest.fixture
def membership_member(test_user_member, community):
    return Membership.objects.create(
        user=test_user_member,
        community=community,
        role=Membership.Role.MEMBER
    )


@pytest.fixture
def valid_image_file():
    file = io.BytesIO()
    image = Image.new('RGB', (10, 10), 'red')
    image.save(file, 'PNG')
    file.seek(0)
    return SimpleUploadedFile(
        name='valid_icon.png',
        content=file.read(),
        content_type='image/png'
    )


@pytest.fixture
def oversized_image_file():
    file = io.BytesIO()
    large_content = b'0' * (8 * 1024 * 1024)
    file.write(large_content)
    file.seek(0)
    return SimpleUploadedFile(
        name='oversized_icon.png',
        content=file.read(),
        content_type='image/png'
    )


@pytest.fixture
def wrong_mime_type_file():
    return SimpleUploadedFile(
        name='document.txt',
        content=b'just a text file.',
        content_type='text/plain'
    )


@pytest.fixture
def corrupted_image_file():
    png_signature = b'\x89PNG\r\n\x1a\n'
    garbage_data = b'This part is corrupted and not a valid image stream.'
    return SimpleUploadedFile(
        name='corrupted.png',
        content=png_signature + garbage_data,
        content_type='image/png'
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

    def test_create_community(self, authenticated_client, test_user, category):
        url = reverse('community-list')
        data = {
            'name': 'newcommunity',
            'slug': 'newcommunity',
            'description': 'newdesc',
            'categories': category.pk
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED

        community = Community.objects.get(slug='newcommunity')

        assert Membership.objects.filter(
            user=test_user,
            community=community,
            role='CREATOR'
        ).exists()

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

    def test_update_community_owner(self, authenticated_client_creator, community, membership_creator):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = authenticated_client_creator.patch(
            url, {'description': 'updated'}
        )
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

    def test_delete_community_owner(self, authenticated_client_creator, community, membership_creator):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = authenticated_client_creator.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Community.objects.filter(pk=community.pk).exists()

    def test_delete_community_not_owner(self, second_user, api_client, community):
        login_url = reverse('login')
        api_client.post(login_url, {
            'email': 'second@example.com',
            'password': 'secondpassword'
        })
        client2 = APIClient()
        client2.cookies = api_client.cookies

        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = client2.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Community.objects.filter(pk=community.pk).exists()

    def test_delete_community_not_authenticated(self, api_client, community):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Community.objects.filter(pk=community.pk).exists()

    def test_create_community_duplicate_slug(self, authenticated_client, community, category):
        url = reverse('community-list')
        data = {
            'name': 'another_name',
            'slug': community.slug,
            'description': 'desc',
            'categories': category.pk
        }
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'slug' in response.data
        assert response.data['slug'] != community.slug

    def test_delete_community_cascade_memberships(self, authenticated_client_creator, community, membership_creator):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        response = authenticated_client_creator.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(community=community).exists()


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

    def test_list_only_posts_for_given_community(self, api_client, community, post, test_user_creator):
        other_community = Community.objects.create(
            creator=test_user_creator,
            name='othercommunity',
            slug='othercommunity',
            description='other'
        )
        other_post = Post.objects.create(
            title='otherpost',
            author=test_user_creator,
            community=other_community
        )

        url = reverse('community-posts-list',
                      kwargs={'community_slug': community.slug})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK

        results = response.data['results']
        assert any(r['id'] == post.id for r in results)
        assert all(r['community_id'] == community.id for r in results)
        assert not any(r['id'] == other_post.id for r in results)


@pytest.mark.django_db
class TestMembershipViewSet():
    def test_join_community(self, authenticated_client, test_user, community):
        url = reverse(
            'community-members-list',
            kwargs={'community_pk': community.pk}
        )
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_201_CREATED

        memberships = Membership.objects.filter(
            user=test_user, community=community)
        assert Membership.objects.filter(
            user=test_user,
            community=community,
            role=Membership.Role.MEMBER
        ).exists()
        assert memberships.count() == 1

    def test_join_community_unauthenticated(self, api_client, community):
        url = reverse(
            'community-members-list',
            kwargs={'community_pk': community.pk}
        )
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Membership.objects.filter(community=community).exists()

    def test_leave_member_community(self, authenticated_client_member, membership_member, community):
        url = reverse(
            'community-members-leave',
            kwargs={'community_pk': community.id}
        )
        response = authenticated_client_member.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(id=membership_member.id).exists()

    def test_leave_creator_community(self, authenticated_client_creator, membership_creator, community):
        url = reverse(
            'community-members-leave',
            kwargs={'community_pk': community.id}
        )
        response = authenticated_client_creator.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Membership.objects.filter(id=membership_creator.id).exists()

    def test_leave_community_not_member(self, authenticated_client, community):
        url = reverse(
            'community-members-leave',
            kwargs={'community_pk': community.id}
        )
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_destroy_membership(self, authenticated_client_member, membership_member, community):
        url = reverse('community-members-detail', kwargs={
            'community_pk': community.id,
            'pk': membership_member.id
        })
        response = authenticated_client_member.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Membership.objects.filter(id=membership_member.id).exists()


@pytest.mark.django_db
class TestCommunityFileUploads:
    def test_update_community_icon_with_valid_file(self, authenticated_client_creator, community, membership_creator, valid_image_file):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        data = {'icon_upload': valid_image_file}

        response = authenticated_client_creator.patch(
            url, data, format='multipart')

        assert response.status_code == status.HTTP_200_OK
        community.refresh_from_db()
        assert community.icon is not None
        assert 'valid_icon' in community.icon.name

    def test_update_community_icon_with_wrong_mime_type(self, authenticated_client_creator, community, membership_creator, wrong_mime_type_file):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        data = {'icon_upload': wrong_mime_type_file}

        response = authenticated_client_creator.patch(
            url, data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'icon_upload' in response.data
        assert 'Invalid file type: text/plain' in response.data['icon_upload'][0]

    def test_update_community_icon_with_oversized_file(self, authenticated_client_creator, community, membership_creator, oversized_image_file):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        data = {'icon_upload': oversized_image_file}

        response = authenticated_client_creator.patch(
            url, data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'icon_upload' in response.data
        assert 'Invalid file type: text/plain' in response.data['icon_upload'][0]

    def test_update_community_icon_with_corrupted_file(self, authenticated_client_creator, community, membership_creator, corrupted_image_file):
        url = reverse('community-detail', kwargs={'slug': community.slug})
        data = {'icon_upload': corrupted_image_file}

        response = authenticated_client_creator.patch(
            url, data, format='multipart')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'icon_upload' in response.data
        assert 'Invalid file type: application/octet-stream' in response.data['icon_upload'][0]

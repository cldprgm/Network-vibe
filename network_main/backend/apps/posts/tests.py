import pytest
import io
import os
import time
from datetime import timedelta

from django.urls import reverse
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone

from rest_framework.test import APIClient
from rest_framework import status

from apps.users.models import CustomUser
from apps.communities.models import Community
from apps.categories.models import Category
from apps.ratings.models import Rating
from apps.posts.models import Post, Comment, Media
from apps.posts.views import (
    get_trending_posts,
    get_user_recommendations,
    get_annotated_ratings,
    get_optimized_post_queryset
)


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


@pytest.fixture
def comment(test_user, post):
    return Comment.objects.create(
        post=post,
        author=test_user,
        content='testcomment',

    )


@pytest.fixture
def media_file(post):
    return Media.objects.create(
        post=post,
        file='backend/media/uploads/avatars/default.png'
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

    def test_create_post_unauthenticated(self, api_client, community):
        data = {
            'author': api_client,
            'title': 'newtestpost',
            'community_obj': community.id
        }
        response = api_client.post(self.url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Post.objects.filter(title='newtestpost').exists()

    def test_create_post_with_media_files(self, authenticated_client, community):
        file_content = (
            b'\x89PNG\r\n\x1a\n'
            b'\x00\x00\x00\rIHDR'
        )
        image = SimpleUploadedFile(
            "test.png",
            file_content,
            content_type="image/jpeg"
        )

        data = {
            'title': 'post with image',
            'community_obj': community.id,
            'media_files': [image],
        }

        response = authenticated_client.post(
            self.url, data, format='multipart'
        )
        assert response.status_code == status.HTTP_201_CREATED
        post = Post.objects.get(title='post with image')
        assert Media.objects.filter(post=post).exists()

        media_file_name = os.path.basename(
            Media.objects.filter(post=post).first().file.name)
        assert media_file_name.startswith(
            "test") and media_file_name.endswith(".png")

    def test_create_post_with_too_many_media_files(self, authenticated_client, community):
        files = []
        for i in range(6):
            file_content = io.BytesIO(b"dummy data")
            files.append(
                SimpleUploadedFile(
                    f"test{i}.jpg", file_content.getvalue(), content_type="image/jpeg")
            )

        data = {
            'title': 'post with too many files',
            'community_obj': community.id,
            'media_files': files
        }

        response = authenticated_client.post(
            self.url, data, format='multipart'
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Post.objects.filter(
            title='post with too many files').exists()

    def test_post_create_invalid_community(self, authenticated_client):
        data = {
            'title': 'invalid community post',
            'community_obj': 999999
        }
        response = authenticated_client.post(reverse('post-list'), data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Post.objects.filter(title='invalid community post').exists()

    def test_post_create_missing_required_fields(self, authenticated_client, community):
        data = {
            'community_obj': community.id
        }
        response = authenticated_client.post(reverse('post-list'), data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not Post.objects.filter(community=community).exists()

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

    def test_update_post_unauthenticated(self, api_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        data = {'title': 'new title'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        post.refresh_from_db()
        assert post.title == 'testpost'

    def test_update_post_not_author(self, api_client, post):
        second_user = CustomUser.objects.create_user(
            username='secondtestuser',
            email='secondtest@example.com',
            password='secondtestpassword',
            is_active=True
        )

        login_url = reverse('login')
        response = api_client.post(login_url, {
            'email': 'secondtest@example.com',
            'password': 'secondtestpassword'
        })
        client = APIClient()
        client.cookies = response.cookies

        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        data = {'title': 'new title'}
        response = client.patch(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        post.refresh_from_db()
        assert post.title == 'testpost'

    def test_update_post_add_media_files(self, authenticated_client, post):
        url = reverse('post-detail', kwargs={'slug': post.slug})

        file_content = (
            b'\x89PNG\r\n\x1a\n'
            b'\x00\x00\x00\rIHDR'
        )
        image = SimpleUploadedFile(
            "new.png",
            file_content,
            content_type="image/jpeg")

        data = {'media_files': [image]}

        response = authenticated_client.patch(url, data, format='multipart')
        assert response.status_code == status.HTTP_200_OK
        post.refresh_from_db()
        assert Media.objects.filter(post=post).count() == 1

        media_file_name = os.path.basename(
            Media.objects.filter(post=post).first().file.name)
        assert media_file_name.startswith(
            "new") and media_file_name.endswith(".png")

    def test_update_post_delete_media_files(self, authenticated_client, post):
        file_content = (
            b'\x89PNG\r\n\x1a\n'
            b'\x00\x00\x00\rIHDR'
        )
        media1 = Media.objects.create(
            post=post,
            file=SimpleUploadedFile(
                "a.jpg", file_content, content_type="image/jpeg")
        )
        media2 = Media.objects.create(
            post=post,
            file=SimpleUploadedFile(
                "b.jpg", file_content, content_type="image/jpeg")
        )

        url = reverse('post-detail', kwargs={'slug': post.slug})

        data = {
            'deleted_media_files': [media1.id],
        }

        response = authenticated_client.patch(url, data, format='multipart')
        assert response.status_code == status.HTTP_200_OK
        post.refresh_from_db()

        remaining_ids = list(Media.objects.filter(
            post=post).values_list("id", flat=True))
        assert media1.id not in remaining_ids
        assert media2.id in remaining_ids

    def test_delete_post(self, authenticated_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Post.objects.filter(id=post.id).exists()

    def test_delete_post_unauthenticated(self, api_client, post):
        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Post.objects.filter(id=post.id).exists()

    def test_delete_post_not_author(self, api_client, post):
        second_user = CustomUser.objects.create_user(
            username='secondtestuser',
            email='secondtest@example.com',
            password='secondtestpassword',
            is_active=True
        )

        login_url = reverse('login')
        response = api_client.post(login_url, {
            'email': 'secondtest@example.com',
            'password': 'secondtestpassword'
        })
        client = APIClient()
        client.cookies = response.cookies

        url = reverse('post-detail', kwargs={'slug': 'testpost'})
        response = client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        post.refresh_from_db()
        assert Post.objects.filter(id=post.id).exists()

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

    def test_post_ratings_create_unauthenticated(self, api_client, test_user, post):
        url = reverse('post-ratings', kwargs={'slug': post.slug})
        data = {'value': 1}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Rating.objects.filter(
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


@pytest.mark.django_db
class TestPostRecommendations:
    def test_get_user_recommendations_authenticated(self, authenticated_client, test_user, post, community):
        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(reverse('post-list')).wsgi_request
        request.user = test_user
        queryset = get_user_recommendations(request, randomize_factor=0.0)

        assert queryset.count() >= 0
        for post in queryset:
            assert hasattr(post, 'sum_rating')
            assert hasattr(post, 'comment_count')
            assert hasattr(post, 'freshness')
            assert hasattr(post, 'community_relevance')
            assert hasattr(post, 'score')
            assert post.user_vote is not None

    def test_get_user_recommendations_excludes_liked_posts(self, authenticated_client, test_user, post, community):
        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(reverse('post-list')).wsgi_request
        request.user = test_user
        queryset = get_user_recommendations(request, randomize_factor=0.0)

        assert post.id not in queryset.values_list('id', flat=True)

    def test_get_trending_posts(self, api_client, post):
        post.created = timezone.now() - timedelta(hours=1)
        post.save()

        request = api_client.get(reverse('post-list')).wsgi_request
        queryset = get_trending_posts(request, days=3, randomize_factor=0.0)

        assert queryset.count() >= 1
        assert post.id in queryset.values_list('id', flat=True)
        for post in queryset:
            assert hasattr(post, 'sum_rating')
            assert hasattr(post, 'comment_count')
            assert hasattr(post, 'freshness')
            assert hasattr(post, 'score')

    def test_get_trending_posts_excludes_old_posts(self, api_client, post):
        post.created = timezone.now() - timedelta(days=10)
        post.save()

        request = api_client.get(reverse('post-list')).wsgi_request
        queryset = get_trending_posts(request, days=3, randomize_factor=0.0)

        assert post.id not in queryset.values_list('id', flat=True)

    def test_get_annotated_ratings_authenticated(self, authenticated_client, test_user, post):
        post_content_type = ContentType.objects.get_for_model(Post)
        Rating.objects.create(
            content_type=post_content_type,
            object_id=post.id,
            user=test_user,
            value=1,
            ip_address='127.0.0.1'
        )

        request = authenticated_client.get(reverse('post-list')).wsgi_request
        request.user = test_user
        queryset = get_annotated_ratings(
            Post.objects.all(), request, post_content_type)

        post = queryset.get(id=post.id)
        assert post.sum_rating == 1
        assert post.user_vote == 1

    def test_get_annotated_ratings_unauthenticated(self, api_client, post):
        post_content_type = ContentType.objects.get_for_model(Post)
        request = api_client.get(reverse('post-list')).wsgi_request
        queryset = get_annotated_ratings(
            Post.objects.all(), request, post_content_type)

        post = queryset.get(id=post.id)
        assert post.sum_rating == 0
        assert post.user_vote == 0

    def test_get_optimized_post_queryset(self, authenticated_client, test_user, post, comment, media_file):
        request = authenticated_client.get(reverse('post-list')).wsgi_request
        request.user = test_user
        queryset = get_optimized_post_queryset(request, action='list')

        post = queryset.get(id=post.id)
        assert hasattr(post, 'sum_rating')
        assert hasattr(post, 'user_vote')
        assert hasattr(post, 'comment_count')
        assert post.comment_count == 1
        assert post.media_data.count() == 1

    def test_post_list_pagination(self, authenticated_client, test_user, community):
        for i in range(30):
            Post.objects.create(
                author=test_user,
                title=f'testpost_{i}',
                community=community,
                status='PB'
            )

        response = authenticated_client.get(
            reverse('post-list'), {'page_size': 10})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 10
        assert response.data['count'] == 30
        assert 'next' in response.data
        assert 'previous' in response.data

    def test_post_list_session_caching(self, authenticated_client, test_user, post):
        response = authenticated_client.get(reverse('post-list'))
        assert response.status_code == status.HTTP_200_OK

        assert 'random_post_ids' in authenticated_client.session
        assert 'random_posts_timestamp' in authenticated_client.session
        assert len(authenticated_client.session['random_post_ids']) >= 1

    def test_post_list_session_cache_expiry(self, authenticated_client, test_user, post):
        authenticated_client.session['random_post_ids'] = [post.id]
        authenticated_client.session['random_posts_timestamp'] = time.time(
        ) - 50
        authenticated_client.session.save()

        response = authenticated_client.get(reverse('post-list'))
        assert response.status_code == status.HTTP_200_OK

        assert authenticated_client.session['random_posts_timestamp'] > time.time(
        ) - 5

    def test_post_list_unauthenticated_trending(self, api_client, post):
        post.created = timezone.now() - timedelta(hours=1)
        post.save()

        response = api_client.get(reverse('post-list'))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
        assert response.data['results'][0]['title'] == 'testpost'


@pytest.mark.django_db
class TestCommentView:
    def get_url(self, post):
        return reverse('post-comments-list', kwargs={'slug': post.slug})

    def test_list_comments(self, api_client, post, comment):
        url = self.get_url(post)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['content'] == 'testcomment'

    def test_create_comment(self, authenticated_client, post):
        url = self.get_url(post)
        data = {'content': 'testcreatecomment'}
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Comment.objects.filter(content='testcreatecomment').exists()

    def test_create_comment_unauthenticated(self, api_client, post):
        url = self.get_url(post)
        data = {'content': 'testcreatecomment'}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Comment.objects.filter(content='testcreatecomment').exists()

    def test_retrieve_comment(self, api_client, post, comment):
        url = reverse(
            'post-comments-detail',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['content'] == 'testcomment'

    def test_update_comment(self, authenticated_client, post, comment):
        url = reverse(
            'post-comments-detail',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        data = {'content': 'new content'}
        response = authenticated_client.patch(url, data)
        assert response.status_code == status.HTTP_200_OK
        comment.refresh_from_db()
        assert comment.content == 'new content'

    def test_update_comment_unauthenticated(self, api_client, post, comment):
        url = reverse(
            'post-comments-detail',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        data = {'content': 'new content'}
        response = api_client.patch(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        comment.refresh_from_db()
        assert comment.content == 'testcomment'

    def test_update_comment_not_author(self, api_client, post, comment):
        second_user = CustomUser.objects.create_user(
            username='secondtestuser',
            email='secondtest@example.com',
            password='secondtestpassword',
            is_active=True

        )

        login_url = reverse('login')
        response = api_client.post(login_url, {
            'email': 'secondtest@example.com',
            'password': 'secondtestpassword'
        })
        client = APIClient()
        client.cookies = response.cookies

        url = reverse(
            'post-comments-detail',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        data = {'content': 'new content'}
        response = client.patch(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN
        comment.refresh_from_db()
        assert comment.content == 'testcomment'

    def test_delete_comment(self, authenticated_client, post, comment):
        url = reverse('post-comments-detail',
                      kwargs={'slug': post.slug, 'pk': comment.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Comment.objects.filter(id=comment.id).exists()

    def test_delete_comment_unauthenticated(self, api_client, post, comment):
        url = reverse('post-comments-detail',
                      kwargs={'slug': post.slug, 'pk': comment.pk})
        response = api_client.delete(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert Comment.objects.filter(id=comment.id).exists()

    def test_comment_ratings_get(self, api_client, post,  comment):
        url = reverse(
            'post-comments-ratings',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'user_vote' in response.data
        assert 'sum_rating' in response.data

    def test_comment_ratings_create(self, authenticated_client, test_user, post, comment):
        url = reverse(
            'post-comments-ratings',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        data = {'value': 1}
        response = authenticated_client.post(url, data)
        assert response.status_code == status.HTTP_201_CREATED
        assert Rating.objects.filter(
            content_type__model='comment',
            object_id=comment.id,
            user=test_user
        ).exists()

    def test_comment_ratings_create_unauthenticated(self, api_client, test_user, post, comment):
        url = reverse(
            'post-comments-ratings',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        data = {'value': 1}
        response = api_client.post(url, data)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert not Rating.objects.filter(
            content_type__model='comment',
            object_id=comment.id,
            user=test_user
        ).exists()

    def test_comment_rating_delete(self, authenticated_client, test_user, post, comment):
        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Comment),
            object_id=comment.id,
            user=test_user,
            ip_address='192.168.0.1',
            value=1
        )

        url = reverse(
            'post-comments-ratings',
            kwargs={'slug': post.slug, 'pk': comment.pk}
        )
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert not Rating.objects.filter(
            content_type__model='comment',
            object_id=comment.id,
            user=test_user
        ).exists()


@pytest.mark.django_db
class TestCommentRepliesView:
    def get_url(self, post, comment):
        return reverse('post-comment-replies', kwargs={'slug': post.slug, 'pk': comment.pk})

    def test_list_replies(self, api_client, post, comment):
        Comment.objects.create(
            post=post,
            author=comment.author,
            content='Reply comment',
            parent=comment
        )

        url = self.get_url(post, comment)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['content'] == 'Reply comment'

    def test_no_replies(self, api_client, post, comment):
        url = self.get_url(post, comment)
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 0


@pytest.mark.django_db
class TestAnnotations:
    def test_post_annotations(self, api_client, post, test_user):
        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Post),
            object_id=post.id,
            user=test_user,
            ip_address='192.168.0.1',
            value=1
        )

        new_user = CustomUser.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='newpassword',
            is_active=True

        )

        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Post),
            object_id=post.id,
            ip_address='192.168.1.1',
            user=new_user,
            value=1
        )

        url = reverse('post-detail', kwargs={'slug': post.slug})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'sum_rating' in response.data
        assert response.data['sum_rating'] == 2
        assert 'user_vote' in response.data
        assert 'comment_count' in response.data

    def test_comment_annotations(self, api_client, post, comment, test_user):
        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Comment),
            object_id=comment.id,
            user=test_user,
            ip_address='192.168.0.1',
            value=1
        )

        new_user = CustomUser.objects.create_user(
            username='newuser',
            email='new@example.com',
            password='newpassword',
            is_active=True

        )

        Rating.objects.create(
            content_type=ContentType.objects.get_for_model(Comment),
            object_id=comment.id,
            ip_address='192.168.1.1',
            user=new_user,
            value=1
        )

        url = reverse('post-comments-detail',
                      kwargs={'slug': post.slug, 'pk': comment.pk})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert 'sum_rating' in response.data
        assert response.data['sum_rating'] == 2
        assert 'user_vote' in response.data


@pytest.mark.django_db
class TestPostMedia:
    def test_media_in_post(self, api_client, post, media_file):
        url = reverse('post-detail', kwargs={'slug': post.slug})
        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert 'media_data' in response.data
        assert len(response.data['media_data']) == 1
        expected_url = f'http://testserver{media_file.file.url}'
        assert response.data['media_data'][0]['file'] == expected_url

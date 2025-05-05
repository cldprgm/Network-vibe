from django.test import TestCase, Client
from django.urls import reverse, resolve
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile

from ..models import Category, Community, Membership, Rating, Post, Comment
from ..views import RatingCreateView, BatchRatingStatusView, CommunityCreateView, \
    CommunityFromCategoryView, CommunityDetailView, MembershipCreateView
from ..forms import CommunityCreateForm


class PostURLTests(TestCase):
    def setUp(self):
        self.client = Client()

        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

        self.client.login(username='testuser', password='test1212test')

        self.category = Category.objects.create(title='test category')
        self.community = Community.objects.create(
            creator=self.user,
            name='community',
            description='community description',
        )
        self.community.categories.add(self.category)

        self.post = Post.objects.create(
            title='test post',
            description='test post description',
            author=self.user,
            community=self.community
        )

    def test_home_page(self):
        response = self.client.get(reverse('home'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'social_network/post_list.html')

    def test_post_create_submission(self):
        post_data = {
            'title': 'test post2',
            'description': 'test post description2',
            'community': self.community.id,
            'status': 'PB',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }

        response = self.client.post(reverse('post_create'), post_data)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Post.objects.filter(title='test post2').exists())

    def test_post_create_unauthorized(self):
        self.client.logout()

        post_data = {
            'title': 'test post4',
            'description': 'test post description4',
            'community': self.community.id,
            'status': 'PB',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }

        response = self.client.post(reverse('post_create'), post_data)
        self.assertEqual(response.status_code, 302)

        expected_url = f'{reverse('user_login')}?next={reverse('post_create')}'
        self.assertEqual(expected_url, response.url)

        self.assertFalse(Post.objects.filter(title='test post4').exists())

    def test_post_detail(self):
        response = self.client.get(reverse(
            'post_detail',
            kwargs={'slug': self.post.slug}
        ))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'social_network/post_detail.html')

    def test_post_update_submission(self):
        post_update_data = {
            'title': 'test post update',
            'description': 'test post description update',
            'community': self.community.id,
            'status': 'PB',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }
        response = self.client.post(
            reverse('post_update', kwargs={'slug': self.post.slug}),
            data=post_update_data
        )
        self.assertEqual(response.status_code, 302)

        self.post.refresh_from_db()

        self.assertEqual(self.post.title, 'test post update')
        self.assertEqual(self.post.description, 'test post description update')
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.community, self.community)

        self.assertRedirects(response, reverse(
            'post_detail', kwargs={'slug': self.post.slug}))

    def test_post_update_invalid_submission(self):
        post_invalid_data = {
            'title': 't',
            'description': 'test post description update',
            'community': self.community.id,
            'status': 'PB',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }
        response = self.client.post(
            reverse('post_update', kwargs={'slug': self.post.slug}),
            data=post_invalid_data
        )
        self.assertEqual(response.status_code, 200)

        self.post.refresh_from_db()

        self.assertEqual(self.post.title, 'test post')
        self.assertEqual(self.post.description, 'test post description')

    def test_post_update_unauthorized(self):
        self.client.logout()

        post_update_data = {
            'title': 'test post update',
            'description': 'test post description update',
            'community': self.community.id,
            'status': 'PB',
            'media-TOTAL_FORMS': '0',
            'media-INITIAL_FORMS': '0',
            'media-MIN_NUM_FORMS': '0',
            'media-MAX_NUM_FORMS': '1000',
        }
        response = self.client.post(
            reverse('post_update', kwargs={'slug': self.post.slug}),
            data=post_update_data
        )
        self.assertEqual(response.status_code, 302)

        expected_url = f'{reverse('home')}?next={reverse('post_update', kwargs={'slug': self.post.slug})}'
        self.assertEqual(response.url, expected_url)

        self.post.refresh_from_db()

        self.assertEqual(self.post.title, 'test post')
        self.assertEqual(self.post.description, 'test post description')
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.community, self.community)


class CommentURLTests(TestCase):
    def setUp(self):
        self.client = Client()

        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

        self.client.login(username='testuser', password='test1212test')

        self.category = Category.objects.create(title='test category')
        self.community = Community.objects.create(
            creator=self.user,
            name='community',
            description='community description',
        )
        self.community.categories.add(self.category)

        self.post = Post.objects.create(
            title='test post',
            description='test post description',
            author=self.user,
            community=self.community
        )

    def test_comment_create_submission(self):
        comment_data = {
            'post': self.post,
            'author': self.user,
            'content': 'test comment content'
        }

        response = self.client.post(
            reverse('comment_create_view', kwargs={'pk': self.post.pk}),
            comment_data
        )
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Comment.objects.filter(
            content='test comment content').exists())

    def test_comment_create_unauthorized(self):
        self.client.logout()

        comment_data = {
            'post': self.post,
            'author': self.user,
            'content': 'test comment unauth'
        }

        response = self.client.post(
            reverse('comment_create_view', kwargs={'pk': self.post.pk}),
            comment_data
        )
        self.assertEqual(response.status_code, 400)

        self.assertFalse(
            Comment.objects.filter(content='test comment unauth').exists()
        )


class RatingURLTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )
        self.client.login(username='testuser', password='test1212test')

        self.category = Category.objects.create(title='test category')
        self.community = Community.objects.create(
            creator=self.user,
            name='community',
            description='community description',
        )
        self.community.categories.add(self.category)

        self.post = Post.objects.create(
            title='test post',
            description='test post description',
            author=self.user,
            community=self.community
        )

        self.comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='test comment'
        )

        self.post_content_type = ContentType.objects.get_for_model(Post)
        self.comment_content_type = ContentType.objects.get_for_model(Comment)

    def test_rating_create_url_resolves(self):
        url = reverse('rating_create')
        self.assertEqual(url, '/rating/create/')
        resolver = resolve('/rating/create/')
        self.assertEqual(resolver.func.__name__,
                         RatingCreateView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'rating_create')

    def test_rating_status_url_resolves(self):
        url = reverse('rating_status')
        self.assertEqual(url, '/rating/status/')
        resolver = resolve('/rating/status/')
        self.assertEqual(resolver.func.__name__,
                         BatchRatingStatusView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'rating_status')

    def test_rating_create_url_post(self):
        data = {
            'content_type_id': self.post_content_type.id,
            'object_id': self.post.id,
            'value': 1
        }
        response = self.client.post(
            reverse('rating_create'),
            data=data,
            REMOTE_ADDR='127.0.0.1'
        )

        self.assertEqual(response.status_code, 200)
        respose_data = response.json()
        self.assertEqual(respose_data['user_vote'], 1)
        self.assertEqual(respose_data['rating_sum'], 1)

        rating = Rating.objects.get(
            user=self.user,
            content_type=self.post_content_type,
            object_id=self.post.id
        )
        self.assertEqual(rating.value, 1)
        self.assertEqual(rating.ip_address, '127.0.0.1')
        self.assertEqual(self.post.get_sum_rating(), 1)

    def test_rating_create_url_comment(self):
        data = {
            'content_type_id': self.comment_content_type.id,
            'object_id': self.comment.id,
            'value': -1
        }
        response = self.client.post(
            reverse('rating_create'),
            data=data,
            REMOTE_ADDR='127.1.0.1'
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['user_vote'], -1)
        self.assertEqual(response_data['rating_sum'], -1)

        rating = Rating.objects.get(
            user=self.user,
            content_type=self.comment_content_type,
            object_id=self.comment.id
        )
        self.assertEqual(rating.value, -1)
        self.assertEqual(rating.ip_address, '127.1.0.1')
        self.assertEqual(self.comment.get_sum_rating(), -1)

    def test_rating_create_url_unauthenticated(self):
        self.client.logout()

        data = {
            'content_type_id': self.post_content_type.id,
            'object_id': self.post.id,
            'value': -1
        }
        response = self.client.post(
            reverse('rating_create'),
            data=data
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_rating_status_url_get_posts(self):
        post2 = Post.objects.create(
            title='Test Post 2',
            description='Another test post',
            author=self.user,
            community=self.community
        )
        Rating.objects.create(
            user=self.user,
            content_type=self.post_content_type,
            object_id=self.post.id,
            value=1,
            ip_address='127.0.0.1'
        )
        params = {
            'content_type': self.post_content_type.id,
            'object_ids': [self.post.id, post2.id]
        }
        response = self.client.get(reverse('rating_status'), params)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        expected = {
            str(self.post.id): {'user_vote': 1, 'rating_sum': 1},
            str(post2.id): {'user_vote': 0, 'rating_sum': 0}
        }
        self.assertEqual(response_data, expected)

    def test_rating_status_url_get_comments(self):
        comment2 = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='Another test comment'
        )
        Rating.objects.create(
            user=self.user,
            content_type=self.comment_content_type,
            object_id=self.comment.id,
            value=-1,
            ip_address='127.0.0.1'
        )
        params = {
            'content_type': self.comment_content_type.id,
            'object_ids': [self.comment.id, comment2.id]
        }
        response = self.client.get(reverse('rating_status'), params)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        expected = {
            str(self.comment.id): {'user_vote': -1, 'rating_sum': -1},
            str(comment2.id): {'user_vote': 0, 'rating_sum': 0}
        }
        self.assertEqual(response_data, expected)

    def test_rating_status_url_missing_params(self):
        response = self.client.get(reverse('rating_status'))
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertEqual(response_data['error'],
                         'Missing content_type or object_ids')


class CommunityURLTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='testother@test.test',
            password='otherpass')
        self.client.login(username='testuser', password='testpass')

        self.parent_category = Category.objects.create(
            title='Parent Category', slug='parent')
        self.child_category = Category.objects.create(
            title='Child Category', slug='child', parent=self.parent_category
        )

        self.community = Community.objects.create(
            name='Test Community',
            description='A test community',
            creator=self.user,
        )
        self.community.categories.add(self.child_category)

        self.post = Post.objects.create(
            title='Test Post',
            description='A test post',
            author=self.user,
            community=self.community
        )

    def test_community_create_url_resolves(self):
        url = reverse('community_create')
        self.assertEqual(url, '/communities/create/')
        resolver = resolve('/communities/create/')
        self.assertEqual(resolver.func.__name__,
                         CommunityCreateView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'community_create')

    def test_community_by_category_url_resolves(self):
        url = reverse('community_by_category', kwargs={'slug': 'child'})
        self.assertEqual(url, '/communities/category/child/')
        resolver = resolve('/communities/category/child/')
        self.assertEqual(resolver.func.__name__,
                         CommunityFromCategoryView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'community_by_category')

    def test_community_detail_url_resolves(self):
        url = reverse('community_detail', kwargs={'slug': 'test-community'})
        self.assertEqual(url, '/communities/test-community/')
        resolver = resolve('/communities/test-community/')
        self.assertEqual(resolver.func.__name__,
                         CommunityDetailView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'community_detail')

    def test_community_join_url_resolves(self):
        url = reverse('community_join', kwargs={'slug': 'test-community'})
        self.assertEqual(url, '/communities/test-community/join')
        resolver = resolve('/communities/test-community/join')
        self.assertEqual(resolver.func.__name__,
                         MembershipCreateView.as_view().__name__)
        self.assertEqual(resolver.view_name, 'community_join')

    def test_community_create_url_get(self):
        response = self.client.get(reverse('community_create'))
        self.assertTemplateUsed(
            response, 'social_network/communities/community_create.html')
        self.assertIsInstance(response.context['form'], CommunityCreateForm)
        self.assertEqual(response.context['title'], 'Community create')

    def test_community_create_url_post_valid(self):
        data = {
            'name': 'New Community',
            'description': 'A new community description',
            'visibility': 'PUBLIC',
            'status': 'PB',
            'categories': [self.child_category.id],
            'banner': SimpleUploadedFile('banner.jpg', b'file_content', content_type='image/jpeg'),
            'icon': SimpleUploadedFile('icon.jpg', b'file_content', content_type='image/jpeg'),
        }
        response = self.client.post(reverse('community_create'), data)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse(
            'community_by_category', kwargs={'slug': 'all'}))
        community = Community.objects.get(name='New Community')
        self.assertEqual(community.creator, self.user)
        self.assertEqual(community.categories.first(), self.child_category)
        membership = Membership.objects.get(
            user=self.user, community=community)
        self.assertTrue(membership.is_moderator)
        self.assertTrue(membership.is_approved)

    def test_community_create_url_unauthenticated(self):
        self.client.logout()
        response = self.client.post(reverse('community_create'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_community_by_category_url_get(self):
        response = self.client.get(
            reverse('community_by_category', kwargs={'slug': 'child'}))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(
            response, 'social_network/communities/community_list.html')
        self.assertEqual(response.context['title'], 'Communities')
        self.assertEqual(
            list(response.context['communities']), [self.community])
        self.assertEqual(list(response.context['child_categories']), [
                         self.child_category])
        self.assertEqual(list(response.context['parent_categories']), [
                         self.parent_category])
        self.assertEqual(response.context['memberships'], {})

    def test_community_by_category_url_invalid_category(self):
        response = self.client.get(
            reverse('community_by_category', kwargs={'slug': 'invalid'}))
        self.assertEqual(response.status_code, 404)

    def test_community_detail_url_get(self):
        response = self.client.get(
            reverse('community_detail', kwargs={'slug': 'test-community'}))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(
            response, 'social_network/communities/community_detail.html')
        self.assertEqual(response.context['community'], self.community)
        self.assertEqual(response.context['title'], 'Test Community')
        self.assertEqual(list(response.context['posts']), [self.post])
        self.assertEqual(
            response.context['post_content_type'], ContentType.objects.get_for_model(Post).id)
        self.assertEqual(list(response.context['moderators']), [])
        self.assertFalse(response.context['is_member'])

    def test_community_detail_url_nonexistent(self):
        response = self.client.get(
            reverse('community_detail', kwargs={'slug': 'nonexistent'}))
        self.assertEqual(response.status_code, 404)

    def test_community_join_url_post_join(self):
        data = {'community': 'test-community'}
        response = self.client.post(
            reverse('community_join', kwargs={'slug': 'test-community'}),
            data
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['membership'], 'created')
        self.assertTrue(Membership.objects.filter(
            user=self.user, community=self.community).exists())

    def test_community_join_url_post_leave(self):
        Membership.objects.create(
            user=self.user, community=self.community, is_approved=True)
        data = {'community': 'test-community'}
        response = self.client.post(
            reverse('community_join', kwargs={'slug': 'test-community'}),
            data
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data['membership'], 'deleted')
        self.assertFalse(Membership.objects.filter(
            user=self.user, community=self.community).exists())

    def test_community_join_url_unauthenticated(self):
        self.client.logout()
        response = self.client.post(
            reverse('community_join', kwargs={'slug': 'test-community'}),
            {'community': 'test-community'}
        )
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_community_join_url_invalid_community(self):
        response = self.client.post(
            reverse('community_join', kwargs={'slug': 'invalid'}),
            {'community': 'invalid'}
        )
        self.assertEqual(response.status_code, 404)

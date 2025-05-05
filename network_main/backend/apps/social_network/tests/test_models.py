from django.test import TestCase
from django.db import IntegrityError
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from mptt.exceptions import InvalidMove

from ..models import Category, Community, Membership, Rating, Post, Comment, Media


User = get_user_model()


class CategoryModelTests(TestCase):
    def setUp(self):
        self.root_category = Category.objects.create(title='Root')
        self.child_category = Category.objects.create(
            title='Child',
            parent=self.root_category
        )

    def test_category_creation(self):
        self.assertEqual(self.root_category.title, 'Root')
        self.assertIsNone(self.root_category.parent)
        self.assertEqual(self.child_category.parent, self.root_category)

    def test_category_str_representation(self):
        self.assertEqual(str(self.root_category), 'Root')
        self.assertEqual(str(self.child_category), 'Child')

    def test_unique_slug_on_dupicate_title(self):
        category1 = Category.objects.create(title='Duplicate')
        category2 = Category.objects.create(title='Duplicate')
        self.assertNotEqual(category1.slug, category2.slug)

    def test_mptt_properties(self):
        self.assertEqual(self.root_category.get_level(), 0)
        self.assertEqual(self.child_category.get_level(), 1)
        self.assertEqual(self.root_category.get_descendant_count(), 1)
        self.assertTrue(self.root_category.is_root_node())
        self.assertTrue(self.child_category.is_child_node())

    def test_category_ordering(self):
        a_category = Category.objects.create(title='A category')
        z_category = Category.objects.create(title='Z category')
        categories = Category.objects.all()
        self.assertEqual(categories[0].title, 'A category')
        self.assertEqual(categories[1].title, 'Root')
        self.assertEqual(categories[2].title, 'Child')
        self.assertEqual(categories[3].title, 'Z category')


class CommunityModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

        self.category = Category.objects.create(
            title='Test category'
        )

        self.community = Community.objects.create(
            creator=self.user,
            name='Test community',
            description='test community description',
            visibility='PUBLIC'
        )

        self.membership = Membership.objects.create(
            user=self.user,
            community=self.community,
            is_moderator=True
        )

        self.community.categories.add(self.category)

    def test_community_creation(self):
        self.assertEqual(self.community.creator, self.user)
        self.assertEqual(self.community.name, 'Test community')
        self.assertEqual(self.community.description,
                         'test community description')
        self.assertEqual(self.community.visibility, 'PUBLIC')
        self.assertEqual(self.community.status, 'PB')
        self.assertTrue(self.community.slug)
        self.assertFalse(self.community.is_nsfw)

    def test_community_str_representation(self):
        self.assertEqual(str(self.community), 'Test community')

    def test_get_absolute_url(self):
        expected_url = reverse('community_detail', kwargs={
                               'slug': self.community.slug})
        self.assertEqual(self.community.get_absolute_url(), expected_url)

    def test_default_image_field(self):
        self.assertEqual(self.community.banner.name,
                         'uploads/community/icons/default_icon.png')
        self.assertEqual(self.community.icon.name,
                         'uploads/community/icons/default_icon.png')

    def test_image_upload(self):
        image = b'test image'
        banner = SimpleUploadedFile('banner.jpg', image, 'image/jpeg')
        icon = SimpleUploadedFile('icon.png', image, 'image/png')

        community = Community.objects.create(
            creator=self.user,
            name='image test',
            description='image test description',
            banner=banner,
            icon=icon
        )

        self.assertTrue(community.banner.name.startswith(
            'uploads/community/banners/'))
        self.assertTrue(community.icon.name.startswith(
            'uploads/community/icons/'))

    def test_get_moderators(self):
        moderators = self.community.get_moderators()
        self.assertIn(self.user, moderators)

    def test_category_relationship(self):
        self.assertIn(self.community, self.category.communities.all())
        self.assertIn(self.category, self.community.categories.all())


class MembershipModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

        self.user2 = User.objects.create(
            username='testuser2',
            email='test2@test.test',
            password='test12212test'
        )

        self.category = Category.objects.create(title='test category')

        self.community = Community.objects.create(
            creator=self.user,
            name='community',
            description='community description',
        )
        self.community.categories.add(self.category)

        self.membership = Membership.objects.create(
            user=self.user,
            community=self.community,
            is_moderator=True,
            is_approved=True
        )

    def test_membership_creation(self):
        self.assertEqual(self.membership.user, self.user)
        self.assertEqual(self.membership.community, self.community)
        self.assertTrue(self.membership.is_approved)
        self.assertTrue(self.membership.is_moderator)
        self.assertIsNotNone(self.membership.joined_at)

    def test_membership_str_representation(self):
        self.assertEqual(str(self.membership), 'testuser')

    def test_membership_default_values(self):
        membership = Membership.objects.create(
            user=self.user2,
            community=self.community
        )

        self.assertFalse(membership.is_moderator)
        self.assertFalse(membership.is_approved)
        self.assertIsNotNone(membership.joined_at)

    def test_relationships(self):
        self.assertIn(self.membership, self.user.memberships.all())
        self.assertIn(self.membership, self.community.members.all())

        moderators = self.community.get_moderators()
        self.assertIn(self.user, moderators)

    def test_multiple_memberships_different_communities(self):
        new_community = Community.objects.create(
            creator=self.user2,
            name='newcomm',
            description='newcomm'
        )
        new_membership = Membership.objects.create(
            user=self.user,
            community=new_community
        )

        self.assertEqual(self.user.memberships.count(), 2)
        self.assertIn(self.membership, self.user.memberships.all())
        self.assertIn(new_membership, self.user.memberships.all())

    def test_cascade_deletion_user(self):
        members_count = Membership.objects.count()
        self.user.delete()
        self.assertEqual(Membership.objects.count(), members_count - 1)

    def test_cascade_deletion_community(self):
        memberhip_count = Membership.objects.count()
        self.community.delete()
        self.assertEqual(Membership.objects.count(), memberhip_count - 1)


class RatingModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

        self.user2 = User.objects.create(
            username='testuser2',
            email='test2@test.test',
            password='test12212test'
        )

        self.category = Category.objects.create(title='test category')
        self.community = Community.objects.create(
            creator=self.user,
            name='community',
            description='community description',
        )
        self.community.categories.add(self.category)

        self.post = Post.objects.create(
            title='test post',
            author=self.user,
            community=self.community
        )

        self.comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='comment content'
        )

        self.post_rating = Rating.objects.create(
            content_object=self.post,
            user=self.user,
            value=1,
            ip_address='127.0.0.1'
        )

        self.comment_rating = Rating.objects.create(
            content_object=self.comment,
            user=self.user,
            value=-1,
            ip_address='127.0.0.1'
        )

    def test_rating_creation(self):
        self.assertEqual(self.post_rating.user, self.user)
        self.assertEqual(self.post_rating.value, 1)
        self.assertEqual(self.post_rating.ip_address, '127.0.0.1')
        self.assertEqual(self.post_rating.content_object, self.post)
        self.assertIsNotNone(self.post_rating.time_created)

    def test_rating_str_representation(self):
        self.assertEqual(str(self.post_rating), f'{self.post} - 1')
        self.assertEqual(str(self.comment_rating), f'{self.comment} - -1')

    def test_unique_together_constraint(self):
        with self.assertRaises(IntegrityError):
            Rating.objects.create(
                user=self.user,
                content_object=self.post,
                value=-1,
                ip_address='128.0.0.1'
            )

    def test_generic_relation_post(self):
        self.assertIn(self.post_rating, self.post.ratings.all())
        self.assertEqual(self.post.get_sum_rating(), 1)

    def test_generic_relation_comment(self):
        self.assertIn(self.comment_rating, self.comment.ratings.all())
        self.assertEqual(self.comment.get_sum_rating(), -1)

    def test_cascade_deletion_user(self):
        rating_count = Rating.objects.count()
        self.user.delete()
        self.assertEqual(Rating.objects.count(), rating_count - 2)

    def test_cascade_deletion_content_object(self):
        rating_count = Rating.objects.count()
        self.post.delete()
        self.assertEqual(Rating.objects.count(), rating_count - 2)
        self.assertFalse(Rating.objects.filter(
            id=self.comment_rating.id).exists())

    def test_ordering(self):
        rating2 = Rating.objects.create(
            user=self.user2,
            content_object=self.post,
            value=1,
            ip_address='128.0.0.1'
        )

        ratings = Rating.objects.all()
        self.assertEqual(ratings[0], rating2)
        self.assertEqual(ratings[1], self.comment_rating)
        self.assertEqual(ratings[2], self.post_rating)

    def test_multiple_ratings_different_users(self):
        rating2 = Rating.objects.create(
            user=self.user2,
            content_object=self.post,
            value=-1,
            ip_address='128.0.0.1'
        )

        self.assertEqual(self.post.ratings.count(), 2)
        self.assertEqual(self.post.get_sum_rating(), 0)


class PostModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

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

    def test_post_creation(self):
        self.assertEqual(self.post.title, 'test post')
        self.assertEqual(self.post.description, 'test post description')
        self.assertEqual(self.post.author, self.user)
        self.assertEqual(self.post.community, self.community)
        self.assertEqual(self.post.status, 'PB')
        self.assertTrue(self.post.slug)
        self.assertIsNotNone(self.post.created)
        self.assertIsNotNone(self.post.updated)

    def test_post_str_representation(self):
        self.assertEqual(str(self.post), 'test post')

    def test_post_unique_slug(self):
        post1 = Post.objects.create(
            title='test post',
            description='test post description1',
            author=self.user,
            community=self.community
        )
        post2 = Post.objects.create(
            title='test post',
            description='test post description2',
            author=self.user,
            community=self.community
        )
        self.assertNotEqual(post1.slug, post2.slug)

    def test_post_title_length_validator(self):
        with self.assertRaises(ValidationError):
            Post.objects.create(
                title='test',
                author=self.user,
                community=self.community
            ).full_clean()

    def test_get_absolute_url(self):
        expected_url = reverse('post_detail', kwargs={'slug': self.post.slug})
        self.assertEqual(expected_url, self.post.get_absolute_url())

    def test_post_ordering(self):
        post2 = Post.objects.create(
            title='test post2',
            author=self.user,
            community=self.community
        )
        posts = Post.objects.all()
        self.assertEqual(posts[0], post2)
        self.assertEqual(posts[1], self.post)

    def test_cascade_deletion_author(self):
        post_count = Post.objects.count()
        self.user.delete()
        self.assertEqual(Post.objects.count(), post_count - 1)

    def test_cascade_deletion_community(self):
        post_count = Post.objects.count()
        self.community.delete()
        self.assertEqual(Post.objects.count(), post_count - 1)

    def test_rating_relationship(self):
        rating = Rating.objects.create(
            content_object=self.post,
            user=self.user,
            value=1,
            ip_address='127.0.0.1'
        )
        self.assertIn(rating, self.post.ratings.all())
        self.assertEqual(self.post.get_sum_rating(), 1)

    def test_comments_relationship(self):
        comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='test comment'
        )
        self.assertIn(comment, self.post.comments.all())

    def test_published_manager(self):
        draft_post = Post.objects.create(
            title='draft post',
            author=self.user,
            community=self.community,
            status='DF'
        )
        published_posts = Post.published.all()
        self.assertIn(self.post, published_posts)
        self.assertNotIn(draft_post, published_posts)
        self.assertEqual(Post.objects.count(), 2)
        self.assertEqual(published_posts.count(), 1)


class CommentModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create(
            username='testuser',
            email='test@test.test',
            password='test1212test'
        )

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

        self.root_comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='root comment content'
        )

        self.child_comment = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='child comment content',
            parent=self.root_comment
        )

    def test_comment_creation(self):
        self.assertEqual(self.root_comment.post, self.post)
        self.assertEqual(self.root_comment.author, self.user)
        self.assertEqual(self.root_comment.content, 'root comment content')
        self.assertIsNone(self.root_comment.parent)
        self.assertEqual(self.child_comment.parent, self.root_comment)
        self.assertIsNotNone(self.root_comment.time_created)
        self.assertIsNotNone(self.root_comment.time_updated)

    def test_comment_str_representation(self):
        self.assertEqual(str(self.root_comment),
                         'testuser:root comment content')
        self.assertEqual(str(self.child_comment),
                         'testuser:child comment content')

    def test_comment_ordering(self):
        comment2 = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='comment content'
        )
        comments = Comment.objects.all()
        self.assertEqual(comments[0], comment2)
        self.assertEqual(comments[1], self.root_comment)
        self.assertEqual(comments[2], self.child_comment)

    def test_cascade_deletion_author(self):
        comment_count = Comment.objects.count()
        self.user.delete()
        self.assertEqual(Comment.objects.count(), comment_count - 2)

    def test_cascade_deletion_post(self):
        comment_count = Comment.objects.count()
        self.post.delete()
        self.assertEqual(Comment.objects.count(), comment_count - 2)

    def test_cascade_deletion_parent(self):
        comment_count = Comment.objects.count()
        self.root_comment.delete()
        self.assertEqual(Comment.objects.count(), comment_count - 2)

    def test_cannot_set_self_as_parent(self):
        with self.assertRaises(InvalidMove):
            self.root_comment.parent = self.root_comment
            self.root_comment.save()

    def test_multiple_comments_same_post(self):
        comment2 = Comment.objects.create(
            post=self.post,
            author=self.user,
            content='another comment'
        )
        self.assertEqual(self.post.comments.count(), 3)
        self.assertIn(self.root_comment, self.post.comments.all())
        self.assertIn(self.child_comment, self.post.comments.all())
        self.assertIn(comment2, self.post.comments.all())

    def test_rating_relationship(self):
        rating = Rating.objects.create(
            content_object=self.root_comment,
            user=self.user,
            value=1,
            ip_address='127.0.0.1'
        )
        self.assertIn(rating, self.root_comment.ratings.all())
        self.assertEqual(self.root_comment.get_sum_rating(), 1)

    def test_mptt_tree_structure(self):
        self.assertEqual(self.child_comment.parent, self.root_comment)
        self.assertIn(self.child_comment, self.root_comment.children.all())
        self.assertEqual(self.root_comment.get_level(), 0)
        self.assertEqual(self.child_comment.get_level(), 1)
        self.assertEqual(self.root_comment.get_descendant_count(), 1)

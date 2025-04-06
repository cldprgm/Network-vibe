from django.urls import path, include
from .views import PostListView, PostDetailView, PostFromCategory, \
    PostCreateView, PostUpdateView, CommentCreateView, RatingCreateView, BatchRatingStatusView, \
    CommunityCreateView, CommunityFromCategoryView, CommunityDetailView, MembershipCreateView

urlpatterns = [
    path('', PostListView.as_view(), name='home'),
    path('post/submit/', PostCreateView.as_view(), name='post_create'),
    path('post/<str:slug>/', PostDetailView.as_view(), name='post_detail'),
    path('post/<str:slug>/update/', PostUpdateView.as_view(), name='post_update'),
    path('post/<int:pk>/comments/create/',
         CommentCreateView.as_view(), name='comment_create_view'),
    path('category/<str:slug>/', PostFromCategory.as_view(),
         name='post_by_category'),
    path('rating/create/', RatingCreateView.as_view(), name='rating_create'),
    path('rating/status/', BatchRatingStatusView.as_view(), name='rating_status'),
    path('communities/create/', CommunityCreateView.as_view(),
         name='community_create'),
    path('communities/category/<str:slug>/',
         CommunityFromCategoryView.as_view(), name='community_by_category'),
    path('communities/<str:slug>/',
         CommunityDetailView.as_view(), name='community_detail'),
    path('communities/<str:slug>/join',
         MembershipCreateView.as_view(), name='community_join'),


]

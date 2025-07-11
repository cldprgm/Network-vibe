from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('', include('apps.social_network.urls')),
    path('accounts/', include('apps.accounts.urls')),
    path("select2/", include("django_select2.urls")),

    path('admin/', admin.site.urls),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/posts/', include('apps.posts.urls')),
    path('api/v1/categories-tree/', include('apps.categories.urls')),
    path('api/v1/communities/', include('apps.communities.urls')),
    # path('api/v1/memberships/', include('apps.memberships.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
    urlpatterns += [path('__debug__/', include('debug_toolbar.urls'))]

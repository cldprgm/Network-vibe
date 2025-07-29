from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/posts/', include('apps.posts.urls')),
    path('api/v1/categories-tree/', include('apps.categories.urls')),
    path('api/v1/communities/', include('apps.communities.urls')),
    path('api/v1/recommendations/', include('apps.recommendations.urls')),
    # path('api/v1/memberships/', include('apps.memberships.urls')),

    path('api/v1/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/v1/schema/swagger-ui/',
         SpectacularSwaggerView.as_view(url_name='schema')),
    path('api/v1/schema/redoc/', SpectacularRedocView.as_view(url_name='schema')),


]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
    urlpatterns += [path('__debug__/', include('debug_toolbar.urls'))]

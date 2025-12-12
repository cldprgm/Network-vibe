from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import LimitOffsetPagination

from django.core.cache import cache
from django.conf import settings

import hashlib

from apps.posts.models import Post
from apps.communities.models import Community
from .throttles import SitemapThrottle


class SitemapPagination(LimitOffsetPagination):
    default_limit = 5000
    max_limit = 10000

    cache_timeout = 3600

    def get_count(self, queryset):
        query_sql = str(queryset.query)
        cache_key = f"sitemap_count_{hashlib.md5(query_sql.encode('utf-8')).hexdigest()}"

        count = cache.get(cache_key)

        if count is not None:
            return count

        count = super().get_count(queryset)

        cache.set(cache_key, count, self.cache_timeout)

        return count


class PostSitemapView(APIView):
    throttle_classes = [SitemapThrottle]
    pagination_class = SitemapPagination

    def get(self, request):
        secret = request.headers.get('X-Sitemap-Token')
        if secret != settings.SITEMAP_SECRET_TOKEN:
            raise PermissionDenied()

        qs = (
            Post.objects
            .filter(status='PB')
            .order_by('-created')
            .values('slug', 'updated')
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)

        return paginator.get_paginated_response(page)


class CommunitySitemapView(APIView):
    throttle_classes = [SitemapThrottle]
    pagination_class = SitemapPagination

    def get(self, request):
        secret = request.headers.get('X-Sitemap-Token')
        if secret != settings.SITEMAP_SECRET_TOKEN:
            raise PermissionDenied()

        qs = (
            Community.objects
            .filter(visibility='PUBLIC')
            .order_by('-created')
            .values('slug', 'updated')
        )
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)

        return paginator.get_paginated_response(page)

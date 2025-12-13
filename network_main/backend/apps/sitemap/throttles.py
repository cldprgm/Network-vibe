from rest_framework.throttling import AnonRateThrottle


class SitemapThrottle(AnonRateThrottle):
    """Limit is defined in settings.py by scope='sitemap'"""
    scope = 'sitemap'

from rest_framework.throttling import AnonRateThrottle


class SearchThrottle(AnonRateThrottle):
    """Limit is defined in settings.py by scope='search'"""
    scope = 'search'

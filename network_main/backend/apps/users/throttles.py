from rest_framework.throttling import UserRateThrottle, AnonRateThrottle


class RegistrationThrottle(AnonRateThrottle):
    """Limit is defined in settings.py by scope='registration'"""
    scope = 'registration'


class LoginThrottle(AnonRateThrottle):
    """Limit is defined in settings.py by scope='login'"""
    scope = 'login'


class EmailVerifyThrottle(AnonRateThrottle):
    """Limit is defined in settings.py by scope='email_verify'"""
    scope = 'email_verify'


class UserStatusUpdateThrottle(UserRateThrottle):
    """Limit is defined in settings.py by scope='user_status_update'"""
    scope = 'user_status_update'

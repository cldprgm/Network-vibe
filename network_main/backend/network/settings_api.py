from .settings_admin_panel import *

INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in [
    'django.contrib.admin',
    'django.contrib.sessions',
    'django.contrib.messages',
]]

MIDDLEWARE = [mw for mw in MIDDLEWARE if mw not in [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
]]

ROOT_URLCONF = 'network.urls_api'

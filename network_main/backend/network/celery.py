import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'network.settings_admin_panel')

app = Celery('network')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

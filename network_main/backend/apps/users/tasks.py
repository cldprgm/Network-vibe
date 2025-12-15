from celery import shared_task
import requests
import os
from urllib.parse import urlparse
from django.core.files.base import ContentFile

from django.core.mail import send_mail
from django.conf import settings

from apps.users.models import CustomUser


@shared_task
def send_verification_link_email(user_id, token, uid):
    try:
        user = CustomUser.objects.get(pk=user_id)
        verification_link = f'{settings.FRONTEND_VERIFICATION_URL}/{uid}/{token}'

        subject = 'Verify Your Email'
        message = (
            f'Hi {user.username}!\n'
            f'Follow this link to verify your account: {verification_link}'
        )
        from_email = settings.EMAIL_HOST_USER
        recipient_list = [user.email]

        send_mail(subject, message, from_email, recipient_list)
    except CustomUser.DoesNotExist:
        pass


@shared_task
def send_verification_email(user, email, code):
    send_mail(
        subject='Verify Your Email',
        message=f'Your verification code is: {code}',
        from_email='noreply@network.com',
        recipient_list=[email],
        fail_silently=False
    )


@shared_task
def download_social_avatar_task(user_id, avatar_url):
    try:
        user = CustomUser.objects.get(id=user_id)
        if user.avatar and 'default' not in str(user.avatar):
            return

        response = requests.get(avatar_url, timeout=10)
        if response.status_code == 200:
            parsed_url = urlparse(avatar_url)
            ext = os.path.splitext(parsed_url.path)[1] or '.jpg'
            filename = f'social_avatar_{user.pk}{ext}'
            user.avatar.save(
                filename,
                ContentFile(response.content),
                save=True
            )

    except CustomUser.DoesNotExist:
        pass
    except Exception as e:
        print(f"Error downloading avatar: {e}")

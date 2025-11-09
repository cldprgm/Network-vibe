from celery import shared_task

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

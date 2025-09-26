from celery import shared_task

from django.core.mail import send_mail


@shared_task
def send_verification_email(user, email, code):
    send_mail(
        subject='Verify Your Email',
        message=f'Your verification code is: {code}',
        from_email='noreply@network.com',
        recipient_list=[email],
        fail_silently=False
    )

import random

from apps.users.models import VerificationCode
from apps.users.tasks import send_verification_email


def generate_code(length=6):
    return ''.join(str(random.randint(0, 9)) for _ in range(length))


def send_verification_code(user):
    code = generate_code(length=6)
    VerificationCode.objects.create(user=user, code=code)
    send_verification_email.delay(user.id, user.email, code)

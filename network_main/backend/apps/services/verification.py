from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes

from apps.users.models import VerificationCode
from apps.users.tasks import send_verification_email, send_verification_link_email


def send_verification_link(user):
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    send_verification_link_email.delay(user.id, token, uid)


def send_verification_code(user):
    code = VerificationCode.generate_for_user(user=user)
    send_verification_email.delay(user.id, user.email, code)

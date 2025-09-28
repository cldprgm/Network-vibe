from apps.users.models import VerificationCode
from apps.users.tasks import send_verification_email


def send_verification_code(user):
    code = VerificationCode.generate_for_user(user=user)
    send_verification_email.delay(user.id, user.email, code)

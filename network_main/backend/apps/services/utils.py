from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from django.utils.crypto import get_random_string

from unidecode import unidecode
from uuid import uuid4
import magic
import requests


GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_USER_EMAIL = "https://api.github.com/user/emails"


@deconstructible
class MimeTypeValidator:
    def __init__(self, allowed_mime_types):
        self.allowed_mime_types = allowed_mime_types

    def __call__(self, value):
        value.seek(0)
        mime_type = magic.from_buffer(value.read(2048), mime=True)
        value.seek(0)
        if mime_type not in self.allowed_mime_types:
            raise ValidationError(f'Invalid file type: {mime_type}')

    def __eq__(self, other):
        return isinstance(other, self.__class__) and self.allowed_mime_types == other.allowed_mime_types


@deconstructible
class FileSizeValidator:
    def __init__(self, max_size_mb=10):
        self.max_size = max_size_mb * 1024 * 1024

    def __call__(self, value):
        if value.size > self.max_size:
            raise ValidationError(
                f'File size cannot exceed {self.max_size/1024/1024}MB.')

    def __eq__(self, other):
        return isinstance(other, self.__class__) and self.max_size == other.max_size


def _trim_slug_by_words(slug: str, max_length: int = 50):
    if len(slug) > max_length:
        last_hyphen = slug.rfind('-', 0, max_length)
        if last_hyphen != -1:
            slug = slug[:last_hyphen]
        else:
            slug = slug[:max_length]
    return slug


def unique_slugify(instance, content):
    model = instance.__class__
    base_slug = slugify(unidecode(content))
    slug = _trim_slug_by_words(base_slug, max_length=30)
    while model.objects.filter(slug=slug).exists():
        slug = f'{slug}-{uuid4().hex[:8]}'

    return slug


def validate_file_size(file, max_file_size_mb: int):
    max_size = max_file_size_mb * 1024 * 1024
    if file.size > max_size:
        raise ValidationError(f'File size cannot exceed {max_file_size_mb}MB.')


def validate_magic_mime(value, allowed_mime_types: dict):
    header = value.read(2048)
    mime_type = magic.from_buffer(header, mime=True)
    value.seek(0)
    main_type = mime_type.split('/')[0]

    if mime_type not in allowed_mime_types.get(main_type, []):
        raise ValidationError(f'Invalid file type: {mime_type}')


def validate_files_length(files, max_files: int):
    if len(files) > max_files:
        raise ValidationError(f'You can upload no more than {max_files} files')


def get_or_create_social_user(
        provider_field: str,
        social_id: str,
        email: str,
        username: str,
        first_name: str = '',
        last_name: str = '',
        avatar: str = None
):
    """
    A universal function for logging in via social media.
    provider_field: The name of the field in the model (for example, 'google_id' or 'github_id')
    """
    from apps.users.models import CustomUser

    filter_kwargs = {provider_field: social_id}
    try:
        return CustomUser.objects.get(**filter_kwargs)
    except CustomUser.DoesNotExist:
        pass

    try:
        user = CustomUser.objects.get(email=email)
        setattr(user, provider_field, social_id)
        user.save()

        return user
    except CustomUser.DoesNotExist:
        if not username:
            username = email.split('@')[0]

        create_kwargs = {
            'email': email,
            'username': username,
            'first_name': first_name,
            'last_name': last_name,
            'password': get_random_string(length=32),
            'is_active': True,
            **filter_kwargs
        }
        if avatar:
            create_kwargs['avatar'] = avatar

        user = CustomUser.objects.create_user(**create_kwargs)
        return user


def get_github_user_data(session: requests.Session, access_token: str) -> dict:
    """Get github user data with access_token"""

    auth_header = {"Authorization": f"token {access_token}"}
    try:
        user_res = session.get(GITHUB_USER_URL, headers=auth_header)
        user_res.raise_for_status()

        data = user_res.json()
        return data
    except requests.exceptions.RequestException:
        raise ValidationError("Failed to get Github user info")


def get_github_user_email(session: requests.Session, access_token: str) -> str:
    """Get github user email with access_token"""

    auth_header = {"Authorization": f"token {access_token}"}
    try:
        email = None

        email_res = session.get(GITHUB_USER_EMAIL, headers=auth_header)
        email_res.raise_for_status()

        emails = email_res.json()
        for e in emails:
            if e.get('primary') and e.get('verified'):
                email = e.get('email')
                return email

        if not email:
            raise ValidationError("No verified email found in GitHub account")
    except requests.exceptions.RequestException:
        raise ValidationError("Failed to get Github user email")

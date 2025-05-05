from django.utils.text import slugify
from django.core.exceptions import ValidationError
from unidecode import unidecode
from uuid import uuid4


def unique_slugify(instance, content):
    model = instance.__class__
    unique_slug = slugify(unidecode(content))
    while model.objects.filter(slug=unique_slug).exists():
        unique_slug = f'{unique_slug}-{uuid4().hex[:8]}'

    return unique_slug


def validate_file_size(value):
    max_size = 10 * 1024 * 1024
    if value.size > max_size:
        raise ValidationError('File size cannot exceed 10MB.')

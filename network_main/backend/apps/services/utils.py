from django.utils.text import slugify
from django.core.exceptions import ValidationError
from unidecode import unidecode
from uuid import uuid4
import magic


ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/webm'],
}


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


def validate_magic_mime(value):
    header = value.read(2048)
    mime_type = magic.from_buffer(header, mime=True)
    value.seek(0)
    main_type = mime_type.split('/')[0]

    if mime_type not in ALLOWED_MIME_TYPES.get(main_type, []):
        raise ValidationError(f'Invalid file type: {mime_type}')

from django.utils.text import slugify
from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from unidecode import unidecode
from uuid import uuid4
import magic


ALLOWED_MIME_TYPES = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'video': ['video/mp4', 'video/webm'],
}


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


def validate_files_length(values):
    max_files = 5
    if len(values) > max_files:
        raise ValidationError(f'You can upload no more than {max_files} files')

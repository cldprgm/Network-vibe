from django.core.exceptions import ValidationError


def validate_file_size(value):
    max_size_mb = 15
    if value.size > max_size_mb * 1024 * 1024:
        raise ValidationError(
            f'File is too big. Max file size: {max_size_mb}MB')

from django.utils.text import slugify
from unidecode import unidecode
from uuid import uuid4


def unique_slugify(instance, content):
    model = instance.__class__
    unique_slug = slugify(unidecode(content))
    while model.objects.filter(slug=unique_slug).exists():
        unique_slug = f'{unique_slug}-{uuid4().hex[:8]}'

    return unique_slug

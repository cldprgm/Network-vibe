import os
import pyvips
import uuid
from celery import shared_task, group
from django.core.files.base import ContentFile
from django.db import transaction
from botocore.exceptions import ClientError

from .models import Post, Media

MAX_SIZE_THRESHOLD = 1 * 1024 * 1024


@shared_task(bind=True, autoretry_for=(ClientError,), retry_kwargs={'max_retries': 3, 'countdown': 4})
def process_image_to_webp(self, image_id):
    temp_input_path = None
    try:
        image = Media.objects.get(id=image_id)

        if not image.file:
            return f"Image {image_id} has no file."

        file_ext = os.path.splitext(image.file.name)[1]
        temp_input_path = f'/tmp/{image_id}_{uuid.uuid4().hex}{file_ext}'

        with open(temp_input_path, 'wb') as f:
            for chunk in image.file.chunks(chunk_size=1024*300):
                f.write(chunk)

        vips_image = pyvips.Image.new_from_file(
            temp_input_path, access='sequential'
        )

        ratio = f"{vips_image.width}/{vips_image.height}"
        image.aspect_ratio = ratio

        update_fields_list = ['aspect_ratio']

        is_small = image.file.size < MAX_SIZE_THRESHOLD
        is_already_webp = image.file.name.lower().endswith('.webp')
        is_gif = image.file.name.lower().endswith('.gif')

        if is_small or is_already_webp or is_gif:
            image.save(update_fields=update_fields_list)
            action = 'Updated ratio only (skipped compression)'
        else:
            webp_buffer = vips_image.write_to_buffer('.webp', Q=50, strip=True)

            basename = os.path.basename(image.file.name)
            new_filename = os.path.splitext(basename)[0] + '.webp'

            image.file.save(new_filename, ContentFile(webp_buffer), save=False)
            update_fields_list.append('file')
            image.save(update_fields=update_fields_list)

            action = 'Converted to WebP and updated ratio'

        return (f'Success image {image_id}: {action}')

    except ClientError as e:
        raise e
    except Exception as e:
        return (f'Error compression for image {image_id}: {e}')
    finally:
        if temp_input_path and os.path.exists(temp_input_path):
            os.remove(temp_input_path)


def start_compression_for_post_media(post_id):
    try:
        post = Post.objects.get(id=post_id)

        if not post.media_data.exists():
            return

        media_qs = post.media_data.all()

        task_list = [
            process_image_to_webp.s(media.id)
            for media in media_qs
            if media.get_media_type() == 'image'
        ]

        if task_list:
            transaction.on_commit(lambda: group(task_list).apply_async())

    except Exception as e:
        return (f'Error start compression for post {post_id}: {e}')

import psycopg2
import random
import boto3
import os
import io
from faker import Faker
from django.utils.text import slugify
from unidecode import unidecode
from uuid import uuid4
from dotenv import load_dotenv
from PIL import Image, ImageDraw

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path)


def unique_slugify(content):
    unique_slug = slugify(unidecode(content))
    unique_slug = f'{unique_slug}-{uuid4().hex[:8]}'
    return unique_slug


def generate_image_data(width=1080, height=1080):
    color = (random.randint(0, 255), random.randint(
        0, 255), random.randint(0, 255))
    image = Image.new('RGB', (width, height), color=color)

    draw = ImageDraw.Draw(image)
    shape_color = (random.randint(0, 255), random.randint(
        0, 255), random.randint(0, 255))

    start = random.randint(0, width // 2)
    end = random.randint(width // 2, width)
    draw.ellipse((start, start, end, end), fill=shape_color)

    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG', quality=85)
    img_byte_arr.seek(0)

    return img_byte_arr.read(), width, height


fake = Faker()

s3_client = boto3.client(
    's3',
    endpoint_url=f'https://{os.getenv("AWS_S3_ENDPOINT_URL")}',
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_S3_REGION_NAME")
)

bucket_name = os.getenv("AWS_STORAGE_BUCKET_NAME")
s3_media_location = 'media'

try:
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM users_customuser')
    author_ids = [row[0] for row in cursor.fetchall()]

    cursor.execute('SELECT id FROM api_network_community')
    community_ids = [row[0] for row in cursor.fetchall()]

    if not author_ids or not community_ids:
        print("Error: No users or communities found in DB.")
        exit()

    print("Generating posts...")
    for _ in range(50):
        title = fake.text(max_nb_chars=50)
        slug = unique_slugify(title)
        description = fake.text(max_nb_chars=150)
        status = 'PB'
        created = fake.date_time_between(start_date='-1y', end_date='now')
        updated = fake.date_time_between(start_date='-1m', end_date='now')
        author_id = random.choice(author_ids)
        community_id = random.choice(community_ids)
        sum_rating = 0
        comment_count = 0
        score = round(random.uniform(-1, 2), 2)

        cursor.execute(
            """
            INSERT INTO api_network_post 
            (title, slug, description, status, created, updated, author_id, community_id, sum_rating, comment_count, score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (title, slug, description, status, created, updated,
             author_id, community_id, sum_rating, comment_count, score)
        )

    cursor.execute('SELECT id FROM api_network_post')
    post_ids = [row[0] for row in cursor.fetchall()]

    print("Uploading images to S3 and linking to posts...")

    upload_to_prefix = "uploads/media"

    for i in range(60):
        try:
            image_content, w, h = generate_image_data(1080, 1080)

            aspect_ratio = float(w) / float(h)

            filename = f"{uuid4().hex}.jpg"
            db_path = f"{upload_to_prefix}/{filename}"
            s3_key = f"{s3_media_location}/{db_path}"

            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=image_content,
                ContentType='image/jpeg',
                ACL='public-read',
                CacheControl='max-age=50000'
            )

            uploaded_at = fake.date_time_between(
                start_date='-1m', end_date='now')
            post_id = random.choice(post_ids)

            cursor.execute(
                """
                INSERT INTO api_network_media (file, uploaded_at, post_id, aspect_ratio)
                VALUES (%s, %s, %s, %s)
                """, (db_path, uploaded_at, post_id, aspect_ratio)
            )

            print(f"[{i+1}/60] Success: {s3_key}")

        except Exception as e:
            print(f"Error on iteration {i}: {e}")
            conn.rollback()
            continue

    conn.commit()
    print("Successfully completed.")

except psycopg2.Error as e:
    print(f'PostgreSQL error: {e}')
except Exception as e:
    print(f'General error: {e}')
finally:
    if 'conn' in locals() and conn:
        cursor.close()
        conn.close()

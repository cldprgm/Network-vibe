import sqlite3
import random
import requests
from faker import Faker
from django.utils.text import slugify
from unidecode import unidecode
from uuid import uuid4
from pathlib import Path


def unique_slugify(content):
    unique_slug = slugify(unidecode(content))
    unique_slug = f'{unique_slug}-{uuid4().hex[:8]}'
    return unique_slug


fake = Faker()

try:
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()

    cursor.execute('SELECT id FROM users_customuser')
    author_ids = [row[0] for row in cursor.fetchall()]

    cursor.execute('SELECT id FROM api_network_community')
    community_ids = [row[0] for row in cursor.fetchall()]

    for _ in range(30):
        title = fake.text(max_nb_chars=50)
        slug = unique_slugify(title)
        description = fake.text(max_nb_chars=150)
        status = 'PB'
        created = fake.date_time_between(start_date='-1y', end_date='now')
        updated = fake.date_time_between(start_date='-1m', end_date='now')
        author_id = random.choice(author_ids)
        community_id = random.choice(community_ids)

        cursor.execute(
            """
            INSERT INTO api_network_post (title, slug, description, status, created, updated, author_id, community_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (title, slug, description, status, created, updated, author_id, community_id)
        )

    MEDIA_ROOT = Path('media/uploads/media')

    cursor.execute('SELECT id FROM api_network_post')
    post_ids = [row[0] for row in cursor.fetchall()]

    for _ in range(40):
        try:
            response = requests.get('https://picsum.photos/1080/1080')
            response.raise_for_status()
        except requests.RequestException as err:
            print(f'Failed to download image: {err}')
            continue

        filename = f"{uuid4().hex}.jpg"
        file_path = MEDIA_ROOT / filename

        with open(file_path, 'wb') as f:
            f.write(response.content)

        file_url = f"uploads/media/{filename}"

        uploaded_at = fake.date_time_between(start_date='-1m', end_date='now')
        post_id = random.choice(post_ids)

        cursor.execute(
            """
            INSERT INTO api_network_media (file, uploaded_at, post_id)
            VALUES (?, ?, ?)
            """, (file_url, uploaded_at, post_id)
        )

    conn.commit()

except sqlite3.Error as e:
    print(f'SQLite error: {e}')
    author_ids = []
    community_ids = []
    post_ids = []
finally:
    if conn:
        conn.close()

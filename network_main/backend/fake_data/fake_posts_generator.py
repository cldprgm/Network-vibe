import psycopg2
import random
from faker import Faker
from django.utils.text import slugify
from unidecode import unidecode
from uuid import uuid4
from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.dev')
load_dotenv(dotenv_path)


def unique_slugify(content):
    unique_slug = slugify(unidecode(content))
    unique_slug = f'{unique_slug}-{uuid4().hex[:8]}'
    return unique_slug


fake = Faker()

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

    for _ in range(100000):
        title = fake.text(max_nb_chars=50)
        slug = unique_slugify(title)
        description = fake.text(max_nb_chars=150)
        status = 'PB'
        created = fake.date_time_between(start_date='-1y', end_date='now')
        updated = fake.date_time_between(start_date='-1m', end_date='now')
        author_id = random.choice(author_ids)
        community_id = random.choice(community_ids)
        sum_rating = 0

        cursor.execute(
            """
            INSERT INTO api_network_post (title, slug, description, status, created, updated, author_id, community_id, sum_rating)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (title, slug, description, status, created, updated, author_id, community_id, sum_rating)
        )
    conn.commit()

except psycopg2.Error as e:
    print(f'PostgreSQL error: {e}')
    author_ids = []
    community_ids = []
    post_ids = []
finally:
    if conn:
        cursor.close()
        conn.close()

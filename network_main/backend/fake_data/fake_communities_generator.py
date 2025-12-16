import psycopg2
import random
import uuid
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

    cursor.execute(
        'SELECT id FROM api_network_category WHERE parent_id IS NOT NULL')
    categories_ids = [row[0] for row in cursor.fetchall()]

    for _ in range(5000):
        name = fake.text(max_nb_chars=10) + str(uuid.uuid4().int)[:10]
        slug = unique_slugify(name)
        description = fake.text(max_nb_chars=150)
        icon = 'uploads/community/icons/default_icon.png'
        banner = 'uploads/community/icons/default_icon.png'
        created = fake.date_time_between(start_date='-1y', end_date='now')
        updated = fake.date_time_between(start_date='-1m', end_date='now')
        is_nsfw = False
        visibility = 'PUBLIC'
        creator_id = random.choice(author_ids)
        categories = random.choice(categories_ids)
        members_count = random.randint(0, 100000)
        activity_score = random.randint(0, 1000)

        cursor.execute(
            """
            INSERT INTO api_network_community
            (name, slug, description, created, updated, creator_id, is_nsfw, visibility, icon, banner, members_count,activity_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (name, slug, description, created,
             updated, creator_id, is_nsfw, visibility, icon, banner, members_count, activity_score)
        )
        community_id = cursor.fetchone()[0]

        selected_categories = random.sample(
            categories_ids, k=random.randint(1, 3))
        for category_id in selected_categories:
            cursor.execute(
                """
                INSERT INTO api_network_community_categories (community_id, category_id)
                VALUES (%s, %s)
                """,
                (community_id, category_id)
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

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
    user_ids = [row[0] for row in cursor.fetchall()]

    cursor.execute('SELECT id FROM api_network_community WHERE id = %s', (1,))
    community_id = cursor.fetchone()[0]

    for _ in range(70200):
        user_id = random.choice(user_ids)
        community_id = community_id
        joined_at = fake.date_time_between(start_date='-1y', end_date='now')
        role = 'MEMBER'

        cursor.execute(
            """
            INSERT INTO api_network_membership
            ("user_id", community_id, joined_at, role)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (user_id, community_id) DO NOTHING
            """,
            (user_id, community_id, joined_at, role)
        )

    conn.commit()

except psycopg2.Error as e:
    print(f'PostgreSQL error: {e}')
    user_ids = []
    community_ids = []
finally:
    if conn:
        cursor.close()
        conn.close()

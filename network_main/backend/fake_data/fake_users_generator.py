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

    for _ in range(100000):
        email = fake.email() + str(uuid.uuid4().int)[:5]
        username = fake.user_name()[:5] + str(uuid.uuid4().int)[:10]
        slug = unique_slugify(username)
        is_active = True
        password = fake.password()
        is_superuser = False
        is_staff = False
        date_joined = fake.date_time_between(start_date='-1y', end_date='now')
        avatar = 'uploads/avatars/default.png'
        description = ''
        first_name = ''
        last_name = ''
        gender = 'male'

        cursor.execute(
            """
            INSERT INTO users_customuser
            (email, username, slug, is_active, password, is_superuser, is_staff, 
            date_joined, avatar, description, first_name, last_name, gender)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (email, username, slug, is_active, password,
             is_superuser, is_staff, date_joined, avatar, description, first_name, last_name, gender)
        )

    conn.commit()

except psycopg2.Error as e:
    print(f'PostgreSQL error: {e}')
finally:
    if conn:
        cursor.close()
        conn.close()

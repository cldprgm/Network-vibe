import psycopg2
import random
from faker import Faker
from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env.dev')
load_dotenv(dotenv_path)


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

    comment_id = 1001

    num_ratings = 8000
    for _ in range(num_ratings):
        user_id = random.choice(author_ids)
        value = 1
        time_created = fake.date_time_between(start_date='-1y', end_date='now')

        comment_content_type_id = 12

        cursor.execute(
            """
            INSERT INTO api_network_rating (content_type_id, object_id, user_id, value, time_created)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            """,
            (comment_content_type_id, comment_id, user_id,
             value, time_created)
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

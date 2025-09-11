#!/bin/sh


python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py loaddata fixtures/categories.json

exec "$@"
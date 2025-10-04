#!/bin/sh
set -e

if [ "$1" = "apibackend" ]; then
  shift

  python manage.py makemigrations
  python manage.py migrate
  python manage.py collectstatic --noinput
  python manage.py loaddata fixtures/categories.json

  exec "$@"
else
  exec "$@"
fi

exec "$@"
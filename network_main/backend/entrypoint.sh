#!/bin/sh
set -e
# fix later
if [ "$1" = "apibackend" ] || [ "$1" = "adminpanel" ]; then
  shift

  python manage.py makemigrations
  python manage.py migrate
  python manage.py collectstatic --verbosity=2 --noinput
  python manage.py loaddata fixtures/categories.json

  exec "$@"
else
  exec "$@"
fi
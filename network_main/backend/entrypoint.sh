#!/bin/sh
set -e

if [ "$1" = "apibackend" ]; then
  shift

  echo "--> API: Running DB migrations..."
  python manage.py migrate

  echo "--> API: Loading fixtures..." 
  python manage.py loaddata fixtures/categories.json

  echo "--> API: Starting Gunicorn..."
  exec "$@"

elif [ "$1" = "adminpanel" ]; then
  shift

  echo "--> Admin: Collecting static files..."
  python manage.py collectstatic --verbosity=2 --noinput

  echo "--> Admin: Starting Gunicorn..."
  exec "$@"

else
  exec "$@"
fi

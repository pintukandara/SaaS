#!/usr/bin/env bash

set -o errexit

echo "==> Running database migrations..."
python manage.py migrate --no-input

echo "==> Starting Celery worker in background..."
celery -A employee_tasks_saas worker --loglevel=info --concurrency=1 &

echo "==> Starting Gunicorn web server..."
exec gunicorn employee_tasks_saas.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2

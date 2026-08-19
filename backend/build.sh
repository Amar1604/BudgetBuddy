#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --no-input

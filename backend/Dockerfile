# Use the official lightweight Python image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition files
COPY requirements.txt /app/

# Install python dependencies (including gunicorn)
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# Copy the rest of the application code
COPY . /app/

# Collect static files for production
RUN python manage.py collectstatic --no-input

# Expose port 10000 (Render's default public web port)
EXPOSE 10000

# Run gunicorn server, binding to the dynamic PORT env variable set by Render
CMD gunicorn config.wsgi:application --bind 0.0.0.0:$PORT

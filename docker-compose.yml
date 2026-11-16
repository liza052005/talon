version: '3.8'

services:
  # --- BACKEND (Django) ---
  backend:
    build:
      context: ./back # <-- Изменили путь на папку back
      dockerfile: Dockerfile
    container_name: talon_backend
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn talon_core.wsgi:application --bind 0.0.0.0:8000"
    expose:
      - "8000"
    environment:
      - DJANGO_SECRET_KEY=super_secret_dev_key_change_me_later
      - DEBUG=1
      - DB_NAME=talon_db
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - DB_HOST=db
      - DB_PORT=5432
    depends_on:
      db:
        condition: service_healthy
    restart: always

  # --- DATABASE (PostgreSQL) ---
  db:
    image: postgres:15-alpine
    container_name: talon_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=talon_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: always

  # --- FRONTEND (React) ---
  frontend:
    build:
      context: ./app # <-- Изменили путь на папку app
      dockerfile: Dockerfile
    container_name: talon_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
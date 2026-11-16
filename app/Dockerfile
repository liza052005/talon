# Это монолитный образ: сначала собираем React, потом запускаем Django + Nginx

# Stage 1: Build React
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY app/package.json app/package-lock.json ./
RUN npm install
COPY app/ .
RUN npm run build

# Stage 2: Python + Django + Nginx
FROM python:3.11-slim

# Устанавливаем Nginx
RUN apt-get update && apt-get install -y nginx gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Python зависимости
WORKDIR /app/backend
COPY back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код Django
COPY back/ .

# Копируем собранный React в папку, откуда Nginx будет его отдавать
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

# Конфиг Nginx (создадим ниже)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Собираем статику Django
RUN python manage.py collectstatic --noinput

EXPOSE 80

# Запускаем Nginx и Gunicorn одновременно
CMD service nginx start && gunicorn talon_core.wsgi:application --bind 0.0.0.0:8000
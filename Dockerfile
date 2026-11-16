FROM python:3.11-slim

# Устанавливаем Node.js и Nginx
RUN apt-get update && apt-get install -y curl nginx gcc libpq-dev
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

# Собираем React
WORKDIR /app/frontend
COPY app/package.json app/package-lock.json ./
RUN npm install
COPY app/ .
RUN npm run build

# Настраиваем Django
WORKDIR /app/backend
COPY back/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY back/ .

# Копируем собранный React в Nginx
COPY --from=0 /app/frontend/build /usr/share/nginx/html

# Конфиг Nginx
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        try_files \ \/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://localhost:8000; \
        proxy_set_header Host \System.Management.Automation.Internal.Host.InternalHost; \
        proxy_set_header X-Real-IP \; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Собираем статику Django
RUN python manage.py collectstatic --noinput

EXPOSE 80

# Запускаем Nginx и Gunicorn
CMD service nginx start && gunicorn config.wsgi:application --bind 0.0.0.0:8000

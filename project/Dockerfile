FROM python:3.11-slim

WORKDIR /app
COPY . /app

RUN apt-get update && apt-get install -y portaudio19-dev \
    && pip install --no-cache-dir -r requirements.txt

CMD ["python", "app.py"]

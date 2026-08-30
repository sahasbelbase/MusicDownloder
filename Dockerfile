FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir -U spotdl

COPY download_playlist.py /app/download_playlist.py

VOLUME ["/app/Songs"]

ENTRYPOINT ["python3", "/app/download_playlist.py", "--output", "/app/Songs"]

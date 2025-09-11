FROM python:3.13.7-slim-bookworm

WORKDIR /usr/src/api_backend

RUN useradd -s /bin/sh -u 1234 nonroot

RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev libmagic1 \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir media; \
    mkdir static

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN sed -i 's/\r$//g' /usr/src/api_backend/entrypoint.sh
RUN chmod +x /usr/src/api_backend/entrypoint.sh

RUN chown -R nonroot:nonroot /usr/src/api_backend
USER nonroot

ENTRYPOINT [ "./entrypoint.sh" ]
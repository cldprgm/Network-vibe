# build stage
FROM python:3.13.7-slim-bookworm as builder

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt

# final stage
FROM python:3.13.7-slim-bookworm

WORKDIR /usr/src/apibackend

RUN useradd -s /bin/sh -u 1234 nonroot

RUN apt-get update && apt-get install -y \
    libpq5 libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .

RUN pip install --no-cache /wheels/*

COPY . .

RUN sed -i 's/\r$//g' /usr/src/apibackend/entrypoint.sh
RUN chmod +x /usr/src/apibackend/entrypoint.sh

USER nonroot

ENTRYPOINT [ "./entrypoint.sh" ]

<a id="readme-top"></a>

<div align="center">
  
  <a href="https://github.com/cldprgm/Network-vibe">
    <img src="network_main/frontend/public/favicon.svg" alt="Logo" width="150" height="auto" />
  </a>
  <br />
  <br />

  <h1 align="center">Network</h1>
  <!-- Badges -->
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
  </a>
  <img src="https://img.shields.io/badge/Django-5.2-0C4B33?style=for-the-badge&logo=django&logoColor=white" alt="Django" />
  <img src="https://img.shields.io/badge/DRF-3.16-ff1709?style=for-the-badge" alt="Django REST Framework" />
  <img src="https://img.shields.io/badge/PostgreSQL-17-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-8.2-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Celery-5.5-37814A?style=for-the-badge&logo=celery&logoColor=white" alt="Celery" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Nginx-1.29-009639?style=for-the-badge&logo=nginx&logoColor=white" alt="Nginx" />

  <br />
  <br />

  <p align="center">
    Full‑stack application with <strong>Backend-first</strong> architecture.
    <br />
    <em>Django REST Framework • PostgreSQL • Redis • Celery • Next.js</em>
    <br />
    <br />
    <a href="https://www.network-vibe.fun/"><strong>🔴 Live Demo</strong></a>
    ·
    <a href="https://www.network-vibe.fun/api/v1/schema/swagger-ui/"><strong>API Docs</strong></a>
    ·
    <a href="#getting-started"><strong>Quick Start</strong></a>
  </p>
</div>


<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#features">Features</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#environment-variables">Environment Variables</a></li>
      </ul>
    </li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>

---

## About The Project

**Network** is an implementation of the "skeleton" of a modern social network. The project focuses on the Backend architecture: API versioning, asynchronous task processing, caching, and containerization.

> **Development Context**
>
> The project was created as part of studying the Django ecosystem (DRF, Celery, Redis). Despite its "Pet-project" status, the architecture is built according to real production solution principles (end-to-end flow, environment separation, security).

### 🌐 Live Preview

The project is already deployed and available at:

**[www.network-vibe.fun](https://www.network-vibe.fun/)**

Important: This is a **preview** (with **fake data**), not a live production project with real users.
However, **functionally and code-wise, it does not differ from a production version** — only the content/data differs.

<details>
  <summary><strong>⚙️ Interesting Deployment Fact (Hybrid Infrastructure)</strong></summary>
  <br />
  
  The project uses a hybrid architecture to optimize resources:
  
  1. **VDS (Gateway)**: Nginx on a remote server accepts HTTPS traffic.
  2. **AutoSSH Tunnel**: Traffic is tunneled through a secure reverse SSH tunnel.
  3. **Small Home Server**: The application itself (Docker Compose) runs on a home server.

  ```mermaid
  graph LR
    User((User)) -- HTTPS --> VDS["VDS Nginx"]
    VDS <== AutoSSH ==> Home["Home Server<br/>(Docker Compose)"]
  ```
</details>

### Key Features
Users can create communities, publish posts, leave comments, use search, and receive content recommendations. A rating system and social network authentication are implemented.


## Tech Stack
### Backend:
  - Django
  - Django REST Framework
  - drf-spectacular
  - djangorestframework-simplejwt
  - Celery + django-celery-beat
  - PostgreSQL
  - Redis
  - django-storages / boto3
  - gunicorn
  - pytest
### Frontend:
  - Next.js (SSR, CSR)
  - React (Typescript)
  - Zustand
  - Jest
### Infrastructure:
  - Docker / Docker Compose
  - Nginx


## Features

### Backend‑first features

- **Versioned API**: routes under `/api/v1/*`.
- **OpenAPI documentation**: Schema + Swagger UI + Redoc.
- **JWT authentication in cookies**: custom `CookieJWTAuthentication` on top of `simplejwt`.
- **OAuth2**: Google, GitHub.
- **Background tasks**: Celery worker + Celery Beat (periodic score/activity recalculation, email sending, avatar downloading when using OAuth2).
- **Redis**:
  - cache (via `django-redis`)
  - broker/results for Celery
- **Media/Static storage**:
  - in `DEBUG=true` — locally
  - in `DEBUG=false` — S3‑compatible via `django-storages`/`boto3`
- **Separation of API and Admin**:
  - API runs with its own `DJANGO_SETTINGS_MODULE=network.settings_api` (without admin/session middleware)
  - Admin panel — `DJANGO_SETTINGS_MODULE=network.settings_main`
- **JSON parser, render**: `drf-orjson-renderer` is used for performance.
- **Rate limiting / throttling**: anon/user throttles + custom scopes.


### Services (docker compose)

In `network_main/compose.dev.yaml` and `network_main/compose.yaml` the following are used:

- `apibackend` (DRF API)
- `admin_panel` (Django admin)
- `db` (PostgreSQL)
- `redis`
- `celery`
- `celery_beat`
- `frontend` (Next.js)
- `nginx` (prod reverse proxy)


## Getting Started

### Prerequisites

- Docker & Docker Compose

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/cldprgm/Network-vibe.git
    cd network_main
    ```

2.  **Configure environment variables**
    Create `.env.dev` files based on the examples (see details in the section below):
    *   `backend/.env.dev`
    *   `frontend/.env.dev`

3.  **Run the project (Dev mode)**
    ```bash
    docker compose -f compose.dev.yaml up --build --watch
    ```

4.  **Access services**
    *   Frontend: `http://localhost:3000`
    *   API: `http://localhost:8000/api/v1/`
    *   Admin: `http://localhost:8001/admin/`

    *For Prod mode, use `compose.yaml`.*




## Environment Variables

The project has two sets of examples:

- `network_main/backend/.env.example`
- `network_main/frontend/.env.example`

In the dev environment `.env.dev` files are used, in prod — `.env`.

<details>
  <summary><strong>Backend Variables (.env)</strong> &mdash; <em>Click to expand</em></summary>

```bash
DEBUG="False" # Enables/disables Django DEBUG mode (affects storages, static/media, etc.)
SECRET_KEY="django-secret-key" # Django secret key
ALLOWED_HOSTS="domain localhost 127.0.0.1 apibackend" # Allowed hosts (space-separated)
CORS_ALLOWED_ORIGINS="https://domain http://localhost:3000 http://frontend:3000 http://127.0.0.1:3000" # CORS origins (space-separated)
CSRF_TRUSTED_ORIGINS="https://domain http://localhost:8001 http://frontend:3000 http://localhost:3000" # CSRF trusted origins (space-separated)

DB_ENGINE="django.db.backends.postgresql" # Django DB backend
DB_NAME="network_db" # DB Name
DB_USER="postgres_user" # DB User
DB_PASSWORD="postgres_password" # DB Password
DB_HOST="db" # DB Host
DB_PORT="5432" # DB Port

POSTGRES_USER="postgres_user" # Created Postgres user (container)
POSTGRES_PASSWORD="postgres_password" # Postgres password (container)
POSTGRES_DB="network_db" # Postgres DB name (container)

FRONTEND_VERIFICATION_URL="http://localhost:3000/user/verify-email" # URL for email verification (frontend)
SITEMAP_SECRET_TOKEN="secret-sitemap-key-123" # Token for sitemap endpoints (must match the token on frontend)

REDIS_URL="redis://redis:6379/1" # Redis cache URL (django-redis)
CELERY_BROKER_URL="redis://redis:6379/0" # Celery broker
CELERY_RESULT_BACKEND="redis://redis:6379/0" # Celery results backend

EMAIL_HOST="smtp.gmail.com" # SMTP host 
EMAIL_PORT="587" # SMTP port 
EMAIL_USE_SSL="True" # SMTP SSL 
EMAIL_USE_TLS="False" # SMTP TLS 
EMAIL_HOST_USER="smtp_email" # SMTP login 
EMAIL_HOST_PASSWORD="smtp_password" # SMTP password 
DEFAULT_FROM_EMAIL="smtp_email" # From address 

GOOGLE_OAUTH2_CLIENT_ID="CLIENT_ID" # Google OAuth client id 
GOOGLE_OAUTH2_SECRET_ID="SECRET_ID" # Google OAuth client secret 
GOOGLE_OAUTH2_REDIRECT_URI="http://localhost:3000" # Google redirect URI 

GITHUB_OAUTH2_CLIENT_ID="CLIENT_ID" # GitHub OAuth client id 
GITHUB_OAUTH2_SECRET_ID="SECRET_ID" # GitHub OAuth client secret 
GITHUB_OAUTH2_REDIRECT_URI="http://localhost:3000/user/oauth/callback/github" # GitHub redirect URI 

AWS_ACCESS_KEY_ID="s3_access_key" # S3 access key (needed if DEBUG=false)
AWS_SECRET_ACCESS_KEY="s3_secret_key" # S3 secret key (needed if DEBUG=false)
AWS_STORAGE_BUCKET_NAME="s3_bucket_name" # S3 bucket (needed if DEBUG=false)
AWS_S3_REGION_NAME="s3_region_name" # S3 region (needed if DEBUG=false)
AWS_S3_ENDPOINT_URL="s3_endpoint_url" # S3 endpoint (S3-compatible) (needed if DEBUG=false)
AWS_PUBLIC_DOMAIN="public_domain" # Public domain for STATIC_URL/MEDIA_URL (needed if DEBUG=false)
```
</details>

<details>
  <summary><strong>Frontend Variables (.env)</strong> &mdash; <em>Click to expand</em></summary>

```bash
NEXT_PUBLIC_SITE_URL="http://ip_address" # Public site URL
NEXT_PUBLIC_API_BASE_URL="http://ip_address/api/v1" # Base API URL for the client
NEXT_PUBLIC_API_ASSETS_URL="https://s3_bucket_name.s3_endpoint_url" # Media/assets base URL
NEXT_PUBLIC_API_BASE_CONTAINER_URL="http://apibackend:8001" # API URL inside docker network
SITEMAP_SECRET_TOKEN="secret-sitemap-key-123" # Token for sitemap/preview scenarios (must match the token on backend)

AWS_S3_ENDPOINT_URL="s3_endpoint_url" # S3 endpoint for remote image origins
AWS_STORAGE_BUCKET_NAME="s3_bucket_name" # Bucket for remote image origins
AWS_PUBLIC_DOMAIN="public_domain" # Public domain for remote image origins

NEXT_PUBLIC_GOOGLE_CLIENT_ID="CLIENT_ID" # Google OAuth client id (frontend)
NEXT_PUBLIC_GITHUB_CLIENT_ID="CLIENT_ID" # GitHub OAuth client id (frontend)
```
</details>


## Project Structure

Repository structure:

<details>
  <summary><strong>📂 Expand project structure</strong></summary>

```text
/project-root
├── network_main/                             # workspace (backend + frontend + infra)
│   ├── backend/                              # Django/DRF backend
│   │   ├── apps/                             # Django apps
│   │   │   │
│   │   │   ├── users/                        # Example app structure (detailed)
│   │   │   │   ├── migrations/               # DB Migrations
│   │   │   │   ├── admin.py                  # Admin panel configuration
│   │   │   │   ├── apps.py                   # App configuration (needed for initialization)
│   │   │   │   ├── authentication.py         # Custom authentication classes
│   │   │   │   ├── managers.py               # Model managers
│   │   │   │   ├── models.py                 # Contains database models
│   │   │   │   ├── serializers.py            # For converting data between Python objects and JSON
│   │   │   │   ├── tasks.py                  # Periodic tasks (Celery Beat)
│   │   │   │   ├── tests.py                  # App tests
│   │   │   │   ├── throttles.py              # Endpoint Rate Limits
│   │   │   │   ├── urls.py                   # Describes routes (URLs)
│   │   │   │   └── views.py                  # Contains views that process requests and return responses
│   │   │   │
│   │   │   ├── categories/                   # Categories tree
│   │   │   ├── communities/                  # Communities
│   │   │   ├── memberships/                  # Memberships
│   │   │   ├── posts/                        # Posts/comments
│   │   │   ├── ratings/                      # Ratings/scores
│   │   │   ├── recommendations/              # Recommendations + Celery tasks
│   │   │   ├── search/                       # Search
│   │   │   │
│   │   │   ├── services/                     # Common service modules
│   │   │   │   ├── mixins.py
│   │   │   │   ├── oauth_tokens.py           # Module for obtaining oauth tokens (Google, GitHub)
│   │   │   │   ├── utils.py                  # Various functions, validators
│   │   │   │   └── verification.py           # Functions triggering tasks (Celery) for sending emails
│   │   │   │
│   │   │   └── sitemap/                      # Sitemap
│   │   │
│   │   ├── fixtures/                         # Django fixtures
│   │   │   └── categories.json
│   │   ├── fake_data/                        # Fake data generators (preview)
│   │   ├── media/                            # Local media (default images, placeholders)
│   │   ├── network/                          # Django project package (settings/urls/celery)
│   │   │   ├── asgi.py
│   │   │   ├── celery.py
│   │   │   ├── settings_api.py               # Config for API (same as settings_main.py but without unnecessary apps and middleware)
│   │   │   ├── settings_main.py              # Config for the main image
│   │   │   ├── urls_admin_panel.py           # URLS for admin panel
│   │   │   ├── urls_api.py                   # URLS for API
│   │   │   └── wsgi.py
│   │   ├── Dockerfile                        
│   │   ├── Dockerfile.dev
│   │   ├── entrypoint.sh
│   │   ├── entrypoint.dev.sh
│   │   ├── manage.py
│   │   ├── pytest.ini
│   │   └── requirements.txt
│   ├── conf.d/                               # Nginx config
│   │   └── nginx.conf
│   ├── frontend/                             # Next.js frontend
│   │   ├── public/                           # Public files
│   │   │   ├── default_icon.png
│   │   │   ├── favicon.svg
│   │   │   ├── file.svg
│   │   │   ├── robots.txt
│   │   │   └── window.svg
│   │   ├── src/                              # Frontend source code
│   │   │   ├── app/                          # App Router (routes/layouts/api)
│   │   │   │   ├── (community_settings)/     # Community settings route group
│   │   │   │   │   ├── communities/
│   │   │   │   │   └── layout.tsx
│   │   │   │   ├── (main)/                   # Main route group
│   │   │   │   │   ├── [postSlug]/
│   │   │   │   │   ├── best/
│   │   │   │   │   ├── communities/
│   │   │   │   │   ├── policy/
│   │   │   │   │   ├── submit/
│   │   │   │   │   ├── user/
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── api/                      # Next.js API routes
│   │   │   │   │   └── proxy/
│   │   │   │   ├── sitemap.xml/              
│   │   │   │   │   └── route.ts
│   │   │   │   ├── sitemaps/                 # For generating sitemaps with dynamic data
│   │   │   │   │   ├── communities/
│   │   │   │   │   ├── posts/
│   │   │   │   │   └── static_pages/
│   │   │   │   ├── globals.css
│   │   │   │   └── layout.tsx
│   │   │   ├── components/                   # Components
│   │   │   ├── services/                     # API requests, types, hooks
│   │   │   ├── styles/
│   │   │   └── zustand_store/                # Zustand Stores
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   ├── compose.dev.yaml                      # Dev docker-compose
│   └── compose.yaml                          # Prod docker-compose
├── LICENSE
├── .gitignore
└── README.md
```
</details>




## Usage

### 📖 API Documentation

- Schema: `/api/v1/schema/`
- Swagger UI: `/api/v1/schema/swagger-ui/`
- Redoc: `/api/v1/schema/redoc/`

### Main Endpoints

- `/api/v1/users/`
- `/api/v1/posts/`
- `/api/v1/search/`
- `/api/v1/categories-tree/`
- `/api/v1/communities/`
- `/api/v1/recommendations/`
- `/api/v1/sitemap/`



## Contributing

If you want to suggest an improvement:

1. Fork the repository
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m "Add some AmazingFeature"`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Owner: `cldprgm`
<br />
Project Link: `https://github.com/cldprgm/Network-vibe`


## Acknowledgments

- Best-README-Template: https://github.com/othneildrew/Best-README-Template

<p align="right">(<a href="#readme-top">back to top</a>)</p>

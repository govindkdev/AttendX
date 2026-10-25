# AttendX — Production Deployment & Operations Guide

**Institute:** GCRG Group of Institutions, Lucknow  
**Target Environments:** Docker, Linux VM, Managed PostgreSQL, Vercel / Nginx  

---

## 1. System Requirements

- **Operating System:** Ubuntu 22.04 LTS / Debian 12 / Windows 11 / macOS
- **Python:** 3.12 or newer
- **Node.js:** 18.x or newer
- **Database:** PostgreSQL 15+ (Production) or SQLite 3 (Development/Testing)
- **RAM:** Minimum 2 GB (4 GB recommended for concurrent OpenCV facial embedding extractions)
- **Disk:** 10 GB SSD

---

## 2. Environment Configuration

Copy the example environment configuration into both backend and frontend directories:

```bash
cp .env.example backend/.env
```

### Key Environment Variables (`backend/.env`):

| Variable | Description | Production Example |
|---|---|---|
| `ENVIRONMENT` | Runtime mode (`production` or `development`) | `production` |
| `DATABASE_URL` | Async PostgreSQL database connection URI | `postgresql+asyncpg://attendx_user:SecretPass@postgres:5432/attendx_db` |
| `SECRET_KEY` | 256-bit cryptographic key for JWT and QR signing | `gen_random_secret_at_least_64_characters` |
| `CAMPUS_LATITUDE` | Campus center latitude (Lucknow) | `26.8467` |
| `CAMPUS_LONGITUDE` | Campus center longitude (Lucknow) | `80.9462` |
| `GEOFENCE_RADIUS_METERS` | Allowed campus radius in meters | `200` |
| `CORS_ORIGINS` | Permitted frontend origins | `https://attendx.gcrg.edu.in` |

---

## 3. Docker Compose Deployment

The project root contains a multi-container `docker-compose.yml` defining the FastAPI backend, React frontend, and PostgreSQL services.

```bash
# Build and launch all services in detached mode
docker compose up -d --build

# Run database migrations and initial administrator provisioning
docker compose exec backend python scripts/provision_admin.py --password "InitialStrongPassword@123"

# Verify container health
docker compose ps
```

---

## 4. Bare-Metal / Virtual Machine Deployment

### Step A: Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Provision initial administrator (ADM-001)
python ../scripts/provision_admin.py --password "Govind@123"

# Run production ASGI server with multiple workers
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Step B: Frontend Build & Serve
```bash
cd frontend
npm install --legacy-peer-deps
npm run build

# Output generated in frontend/dist/
# Serve via Nginx or any modern static web server
```

### Step C: Nginx Reverse Proxy Example
```nginx
server {
    listen 80;
    server_name attendx.gcrg.edu.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name attendx.gcrg.edu.in;

    ssl_certificate /etc/letsencrypt/live/attendx.gcrg.edu.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendx.gcrg.edu.in/privkey.pem;

    # Frontend Single Page App
    location / {
        root /var/www/attendx/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

# AttendX — AI-Powered Smart Attendance & Institute Management System

**Official Institution:** GCRG Group of Institutions  
**Location:** Lucknow, Uttar Pradesh, India  
**Initial Provisioned Administrator:** Govind Kushwaha (`ADM-001`)  

---

## 1. Project Overview

**AttendX** is an enterprise-grade Smart Attendance and Institute Management System engineered specifically for the GCRG Group of Institutions, Lucknow. Designed to eliminate attendance fraud, proxy check-ins, and paperwork overhead, AttendX combines:

- **Biometric Face Verification:** WebRTC camera access, 128-dimensional facial embedding vectors, and cosine similarity matching.
- **Dynamic Signed QR Codes:** Cryptographic HMAC-SHA256 tokens with short expiration windows to prevent off-site sharing.
- **Geofence Enforcement:** Haversine WGS-84 coordinate validation ensuring check-ins occur strictly within the Lucknow campus perimeter (26.8467° N, 80.9462° E).
- **AttendX AI Assistant:** Natural-language conversational query engine powered by schema-aware database introspection.
- **Multi-Channel Alerts:** Real-time notifications and lecture-end parent email/SMS alerts for absent students.
- **Audited Compliance:** Immutable audit logs and formula-injection-safe Excel, CSV, and official PDF report exports.

---

## 2. Absolute No-Demo-Data Policy

In strict accordance with the master system architecture, AttendX contains **zero synthetic or fake demo data**.
- There are no fake students, fake teachers, fake timetable entries, or fake attendance records in the database.
- Every dashboard metric and analytics report queries real, authenticated database records.
- In unpopulated states, AttendX presents professional empty states guiding authorized users to register legitimate institute entities.
- The **only** pre-provisioned account is the initial System Administrator (`ADM-001`).

---

## 3. Technology Stack

### Frontend
- **Framework:** React 19, TypeScript, Vite
- **Styling & UI:** Tailwind CSS v4, Lucide React
- **Routing & State:** React Router v7, TanStack Query v5, React Hook Form, Zod
- **Data Visualization:** Recharts
- **Testing:** Vitest, React Testing Library, JSDOM

### Backend
- **Language & API:** Python 3.12+, FastAPI, Pydantic v2
- **ORM & Database:** SQLAlchemy 2.0 (Async), Alembic, PostgreSQL (Production) / Async SQLite (`aiosqlite`)
- **Computer Vision & Biometrics:** OpenCV (`opencv-python-headless`), NumPy vector cosine similarity
- **Security & Cryptography:** Argon2id (`Type.ID`), PyJWT, HMAC-SHA256, secrets
- **Reporting & Exports:** openpyxl (Excel), ReportLab (PDF), CSV with UTF-8 BOM
- **Testing:** Pytest, HTTPX AsyncClient

---

## 4. Folder Structure

```
AttendX/
├── backend/
│   ├── alembic/                # Async database migrations
│   ├── app/
│   │   ├── api/v1/endpoints/   # Modular REST API routes
│   │   ├── core/               # Security, config & admin provisioning
│   │   ├── db/                 # Async database session & engine
│   │   ├── models/             # SQLAlchemy entity models
│   │   ├── permissions/        # RBAC dependency guards
│   │   ├── schemas/            # Pydantic request & response schemas
│   │   ├── services/           # Face recognition, QR, AI & reporting
│   │   └── main.py             # FastAPI entry point & lifespan
│   ├── tests/                  # Pytest async test suite
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI, Navbar, Footer, Sidebar, AI Widget
│   │   ├── features/           # AuthContext & state providers
│   │   ├── layouts/            # PublicLayout & PortalLayout
│   │   ├── pages/              # 45 complete pages across 5 portals:
│   │   │   ├── public/         # Home, About, Features, How It Works, Security, Contact
│   │   │   ├── auth/           # Login, CreateAccount, ForgotPassword, ChangePassword
│   │   │   ├── student/        # Student Dashboard, Face, QR, Timetable, History, Leaves...
│   │   │   ├── teacher/        # Teacher Dashboard, Start Session, QR, Manual, Classes...
│   │   │   └── admin/          # Admin Dashboard, Students, Faculty, Classes, Geofence, Audit...
│   │   ├── services/           # Axios/Fetch API client & blob downloaders
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # Route definitions & RBAC guards
│   │   └── main.tsx
│   ├── tests/                  # Vitest unit test suite
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── architecture.md         # Full system architecture & data flow diagrams
│   ├── database-schema.md      # Data dictionary & relational schema catalog
│   ├── api-guide.md            # Complete REST API documentation & payloads
│   ├── security.md             # Argon2id, biometric privacy & threat mitigation
│   ├── deployment.md           # Docker, Nginx & production deployment guide
│   └── testing.md              # Quality assurance matrix & test documentation
├── scripts/
│   └── provision_admin.py      # Administrator provisioning CLI
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 5. Quickstart Guide

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm

---

### Step 1: Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step 2: Provision Initial Administrator
To provision the initial administrator for GCRG Group of Institutions:
```bash
python ../scripts/provision_admin.py --password "Govind@123"
```
**Administrator Credentials:**
- **Admin ID:** `ADM-001`
- **Full Name:** `Govind Kushwaha`
- **Email:** `admin@gcrg.edu.in`
- **Initial Password:** `Govind@123`
*(Note: A mandatory password rotation is enforced upon first login.)*

---

### Step 3: Start the Backend Server
```bash
# In the backend directory with venv activated:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Root: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`
- Health Probe: `http://localhost:8000/health`

---

### Step 4: Frontend Setup & Launch
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install --legacy-peer-deps

# Start Vite development server
npm run dev
```
- Application Portal: `http://localhost:5173`

---

## 6. Running Tests

### Backend Test Suite (Pytest)
```bash
cd backend
.\venv\Scripts\python.exe -m pytest tests -v
```
*Executes 12 test suites covering authentication, biometric similarity, QR signing, GPS geofencing, reports, and AI query introspection.*

### Frontend Test Suite (Vitest)
```bash
cd frontend
npm test
```
*Executes unit and integration tests verifying zero-data empty states, auth token lifecycle, and GCRG institutional branding.*

### Frontend Production Build
```bash
cd frontend
npm run build
```
*Performs full TypeScript compilation (`tsc -b`) and asset bundling via Vite.*

---

## 7. Portal Access Overview

| Portal | URL Path | Access Policy |
|---|---|---|
| **Public Website** | `/`, `/about`, `/features`, `/how-it-works`, `/security`, `/contact` | Public / Unrestricted |
| **Authentication** | `/login`, `/create-account`, `/forgot-password`, `/change-password` | Public / Activation |
| **Student Portal** | `/student/*` (`dashboard`, `face-attendance`, `scan-qr`, `timetable`...) | Role: `STUDENT` |
| **Teacher Portal** | `/teacher/*` (`dashboard`, `start-attendance`, `qr-attendance`, `reports`...) | Role: `TEACHER` |
| **Admin Portal** | `/admin/*` (`dashboard`, `students`, `teachers`, `gps-settings`, `audit-logs`...) | Role: `ADMIN` |

---

## 8. Documentation Sitemap

For comprehensive documentation, see the `docs/` directory:
- [Architecture & System Design](docs/architecture.md)
- [Database Schema & Data Dictionary](docs/database-schema.md)
- [REST API Guide & Endpoints](docs/api-guide.md)
- [Security Architecture & Threat Mitigation](docs/security.md)
- [Production Deployment & Docker](docs/deployment.md)
- [Quality Assurance & Testing Guide](docs/testing.md)

---

## 9. License & Governance

Copyright © 2026 GCRG Group of Institutions, Lucknow, Uttar Pradesh, India. All rights reserved. Built with React, Python FastAPI, PostgreSQL, and Computer Vision.

# AttendX — Production Deployment & Architecture Guide

AttendX is a full-stack Smart Attendance Infrastructure engineered with a modern **React + Vite frontend** and a high-performance **Node.js/Express backend** powered by **SQLite WAL (Write-Ahead Logging)**, a **512-dimensional Biometric Vector Matching Engine**, and **Campus Geo-Fencing (Haversine formula)**.

---

## 🚀 1. Quick Start Locally

### Option A: Run Full-Stack Server (Frontend + Backend on Port 5000)
```bash
# 1. Install dependencies
npm install
cd server && npm install && cd ..

# 2. Build the production React application
npm run build

# 3. Start the unified production server
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser. The Express server directly serves both the compiled React SPA and all `/api/...` endpoints.

### Option B: Run in Development Mode (Hot-Reloading)
In two separate terminals:
```bash
# Terminal 1: Backend API (Port 5000)
node server/index.js

# Terminal 2: Vite Dev Server (Port 5173 with auto-proxy to 5000)
npm run dev
```

---

## 🌐 2. Direct Cloud Deployment (1-Click Ready)

### A. Deploy to Render.com (Recommended — 100% Free)
1. Push this repository to GitHub or GitLab.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Connect your repository.
4. Set the following settings:
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && cd server && npm install && cd .. && npm run build
     ```
   - **Start Command**:
     ```bash
     node server/index.js
     ```
5. Click **Deploy Web Service**! Render will build and deploy the application.

---

### B. Deploy via Docker (Any VPS / DigitalOcean / AWS / GCP)
This project includes a multi-stage `Dockerfile`:
```bash
# Build the Docker image
docker build -t attendx-smart-attendance .

# Run the container on port 5000
docker run -d -p 5000:5000 --name attendx-app attendx-smart-attendance
```
Access your app at `http://YOUR_SERVER_IP:5000`.

---

### C. Deploy to Railway.app
1. Link your GitHub repo to [Railway.app](https://railway.app).
2. Railway detects Node automatically. Set the start command to:
   ```bash
   node server/index.js
   ```
3. Add build command:
   ```bash
   npm install && cd server && npm install && cd .. && npm run build
   ```

---

## 🔑 Default Credentials

| Role | AttendX ID | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | `STU-2026-001` | `student@attendx.com` | `Student@123` | Govind Kushwaha (B.Tech CSE 4th Year) |
| **Teacher** | `TCH-2026-001` | `teacher@attendx.com` | `Teacher@123` | Dr. Rajesh Sharma (Professor & HOD) |
| **Admin** | `ADM-2026-001` | `admin@attendx.com` | `Admin@123` | Prof. Amitabh Verma (Chief Admin) |
| **Authority OTP** | — | — | `123456` | For Authority verification on Admin registration |

---

## 🛡️ Core Engine Architecture

1. **AI Face Recognition Engine (`server/utils/biometricEngine.js`)**:
   - Generates 512-dimensional normalized biometric embeddings.
   - Evaluates Cosine Similarity against enrolled vectors in `face_embeddings` table.
   - Requires Admin Biometric Face Enrollment before students can mark attendance.

2. **Campus Geofencing Engine (`server/utils/geofenceCalculator.js`)**:
   - Uses the Haversine great-circle formula to calculate student distance from campus center coordinates.
   - Automatically blocks attendance logged outside the designated boundary.

3. **Identity Issuance Hierarchy**:
   - Central Authorities issue Admin IDs (`ADM-2026-XXX`).
   - Admins issue Student IDs (`STU-2026-XXX`) and Teacher IDs (`TCH-2026-XXX`).
   - Teachers create active QR attendance sessions with real-time countdown expiry.

4. **Zero-Config Persistent Storage**:
   - Uses `better-sqlite3` in WAL mode stored at `server/attendx.db`.
   - Requires zero cloud database setup, yet fully supports high concurrency and instant query speeds.

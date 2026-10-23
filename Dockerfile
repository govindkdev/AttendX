# =========================================================
# ATTENDX - PRODUCTION MULTI-STAGE DOCKERFILE
# =========================================================
# 1. Builds React Vite frontend into optimized static bundle
# 2. Bundles Express API backend with SQLite database
# 3. Serves full-stack system on port 5000 with 0 external dependencies
# =========================================================

# --- STAGE 1: FRONTEND BUILD ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Install build dependencies for compilation
COPY package*.json ./
RUN npm ci

# Copy source code and compile Vite production bundle
COPY . .
RUN npm run build

# --- STAGE 2: BACKEND RUNTIME ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install build tools for native SQLite module compilation if needed
RUN apk add --no-cache python3 make g++

# Install backend dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --omit=dev

WORKDIR /app

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy backend files and database
COPY server/ ./server/

# Expose server port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start AttendX Unified Fullstack Server
CMD ["node", "server/index.js"]

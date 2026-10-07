# ---------- Build Frontend ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package.json and install deps
COPY frontend/package*.json ./
RUN npm install

# Copy frontend source and build
COPY frontend .
RUN npm run build


# ---------- Production Image ----------
FROM node:20-alpine

WORKDIR /app

# Install backend dependencies (including devDependencies to run 'npm run build')
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma
RUN cd backend && npm install && ./node_modules/.bin/prisma generate

# Copy backend source
COPY backend ./backend

# Build backend
RUN cd backend && ./node_modules/.bin/prisma generate && npm run build

# Copy built frontend into backend/public
COPY --from=frontend-build /app/frontend/dist ./backend/public

# Set production environment
ENV NODE_ENV=production

WORKDIR /app/backend

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5001/api/health || exit 1

# Run migrations then start within Eco 512MB (cap old-space to leave room for Postgres client + socket)
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node --max-old-space-size=400 --trace-uncaught dist/index.js"]

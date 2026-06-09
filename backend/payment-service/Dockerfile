# Stage 1: Install dependencies saja
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Jalankan aplikasi dengan image super ramping & aman
FROM node:20-alpine
WORKDIR /app

# Best Practice Keamanan Container: Jalankan sebagai user non-root
USER node

COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "src/server.js"]
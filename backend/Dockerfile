# syntax=docker/dockerfile:1.6

# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ─── Runtime stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app

# Non-root user for runtime
RUN addgroup -S app && adduser -S app -G app

# Copy installed deps + source
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=app:app package.json ./
COPY --chown=app:app src ./src

# Persistent upload volume for the 'local' storage adapter
RUN mkdir -p /app/uploads && chown -R app:app /app/uploads
VOLUME ["/app/uploads"]

USER app
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "src/server.js"]

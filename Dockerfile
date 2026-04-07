# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Copy prisma schema before npm ci (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
RUN npm ci

# Copy source files
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone server files (includes server.js and dependencies)
COPY --from=builder /app/.next/standalone ./

# Overwrite with our custom server.js (has MIME type handling & stale chunk fallback)
COPY --from=builder /app/server.js ./server.js

# Copy static files (chunks, css, etc)
COPY --from=builder /app/.next/static ./.next/static/

# Copy public assets
COPY --from=builder /app/public ./public/

# Copy prisma for runtime migrations
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/

# Copy prisma CLI for running migrations
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma/

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Verify files exist for debugging
RUN ls -la .next/static/chunks/ | head -20

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

# Use entrypoint to run migrations before starting server
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]

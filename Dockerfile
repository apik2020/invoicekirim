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

# Create necessary directories
RUN mkdir -p .next/static public/images

# Copy standalone server files (includes built-in server.js)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

# Copy prisma for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Verify files exist
RUN ls -la .next/static && ls -la server.js && ls -la public/images/

EXPOSE 3000

# Dokploy may override PORT, so healthcheck uses localhost:3000 by default
# but the app will bind to whatever PORT is set
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check - simple TCP check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]

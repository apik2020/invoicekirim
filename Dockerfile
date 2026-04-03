# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package.json package-lock.json* ./

# Copy prisma schema before npm ci (needed for postinstall)
COPY prisma ./prisma/

# Install dependencies (this will run prisma generate via postinstall)
# Use --prefer-offline for faster builds but ensure fresh install
RUN npm ci --prefer-offline || npm ci

# Copy source files
COPY . .

# Clean previous build if exists
RUN rm -rf .next

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy all necessary files for non-standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]

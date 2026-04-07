#!/bin/sh
set -e

echo "========================================="
echo " NotaBener - Starting Container"
echo " Environment: $NODE_ENV"
echo "========================================="

# Run Prisma migrations (safe for production)
echo "[Entrypoint] Running Prisma migrations..."

# First, generate Prisma Client (in case it's missing)
npx prisma generate --schema=./prisma/schema.prisma 2>/dev/null || true

# Try to run migrations
# Use migrate deploy for production (applies pending migrations without creating new ones)
# Falls back to db push if no migrations exist (for new databases)
if npx prisma migrate deploy 2>/dev/null; then
  echo "[Entrypoint] Migrations applied successfully!"
else
  echo "[Entrypoint] No migrations found or migrate failed, trying db push..."
  if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "[Entrypoint] Database schema pushed successfully!"
  else
    echo "[Entrypoint] Warning: Could not sync database schema, starting anyway..."
  fi
fi

echo "[Entrypoint] Starting server on port $PORT..."
echo "========================================="

# Execute the main command
exec "$@"

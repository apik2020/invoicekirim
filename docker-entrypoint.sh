#!/bin/sh
set -e

echo "========================================="
echo " NotaBener - Starting Container"
echo " Environment: $NODE_ENV"
echo "========================================="

# Run Prisma migrations (safe for production)
echo "[Entrypoint] Running Prisma migrations..."

# Use node to invoke prisma CLI directly (npx doesn't work in standalone container)
PRISMA_CLI="./node_modules/prisma/build/index.js"

if [ ! -f "$PRISMA_CLI" ]; then
  echo "[Entrypoint] WARNING: Prisma CLI not found at $PRISMA_CLI"
  echo "[Entrypoint] Skipping database schema sync..."
else
  # Try migrate deploy first (applies pending migrations)
  if node "$PRISMA_CLI" migrate deploy 2>&1; then
    echo "[Entrypoint] Migrations applied successfully!"
  else
    echo "[Entrypoint] Migrate failed, trying db push..."
    if node "$PRISMA_CLI" db push --accept-data-loss 2>&1; then
      echo "[Entrypoint] Database schema pushed successfully!"
    else
      echo "[Entrypoint] ERROR: Could not sync database schema!"
      echo "[Entrypoint] Check DATABASE_URL and DIRECT_URL environment variables."
    fi
  fi
fi

echo "[Entrypoint] Starting server on port $PORT..."
echo "========================================="

# Execute the main command
exec "$@"

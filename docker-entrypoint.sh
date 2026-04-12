#!/bin/sh
set -e

echo "========================================="
echo " NotaBener - Starting Container"
echo " Environment: $NODE_ENV"
echo "========================================="

# Run database migrations using lightweight migration runner
echo "[Entrypoint] Running database migrations..."

MIGRATE_SCRIPT="./scripts/migrate.js"

if [ -f "$MIGRATE_SCRIPT" ]; then
  if node "$MIGRATE_SCRIPT" 2>&1; then
    echo "[Entrypoint] Migrations completed successfully!"
  else
    echo "[Entrypoint] WARNING: Migration runner failed, starting anyway..."
  fi
else
  echo "[Entrypoint] No migration script found, skipping..."
fi

echo "[Entrypoint] Starting server on port $PORT..."
echo "========================================="

# Execute the main command
exec "$@"

#!/bin/bash
# Script untuk rebuild dan deploy dengan clean cache

echo "🧹 Cleaning old builds..."
rm -rf .next
rm -rf node_modules/.cache

echo "📦 Rebuilding Docker image..."
docker build --no-cache -t notabener:latest .

echo "🚀 Restarting container..."
docker-compose down
docker-compose up -d

echo "✅ Done! Check logs with: docker-compose logs -f"

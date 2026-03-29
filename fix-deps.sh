#!/bin/bash

echo "Fixing dependencies..."

# Kill any running dev server
echo "Killing any running dev servers..."
pkill -f "next dev" 2>/dev/null

# Install autoprefixer
echo "Installing autoprefixer..."
npm install autoprefixer@latest --save-dev

# Start dev server
echo "Starting dev server..."
npm run dev

#!/bin/bash

# Autodox Deployment Script
# Deploy latest code, install dependencies, run migrations, and restart the app

set -e  # Exit on any error

# Configuration
APP_DIR="/var/www/autodox"
LOG_FILE="/var/log/autodox/deploy.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "====== Starting Autodox Deployment ======"
log "Working directory: $APP_DIR"

# Change to app directory
cd "$APP_DIR" || error_exit "Failed to change to app directory"

# 1. Fetch latest code from master
log "Fetching latest code from master..."
git fetch origin master || error_exit "Failed to fetch from git"
git reset --hard origin/master || error_exit "Failed to reset to latest master"
log "✓ Code updated successfully"

# 2. Install dependencies
log "Installing dependencies with npm..."
npm install || error_exit "Failed to install dependencies"
log "✓ Dependencies installed"

# 3. Run database migrations
log "Generating and running database migrations..."
npx drizzle-kit generate || error_exit "Failed to generate migrations"
npx drizzle-kit migrate || error_exit "Failed to run migrations"
log "✓ Migrations completed"

# 4. Build application
log "Building application..."
npm run build || error_exit "Failed to build application"
log "✓ Build completed successfully"

# 5. Restart PM2 app (zero-downtime reload)
log "Restarting application with PM2..."
pm2 reload autodox || error_exit "Failed to reload PM2"
log "✓ Application restarted"

# 6. Verify app is running
sleep 2
if pm2 pid autodox > /dev/null 2>&1; then
    log "✓ Application is running"
else
    error_exit "Application failed to start after deployment"
fi

log "====== Deployment completed successfully ======"
exit 0

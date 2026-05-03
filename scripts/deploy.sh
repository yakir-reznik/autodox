#!/bin/bash

# Autodox Deployment Script
# Deploy latest code, install dependencies, run migrations, and restart the app

set -e  # Exit on any error

# Load NVM/Node environment for non-interactive shells (e.g. ssh remote commands)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Configuration
APP_DIR="/var/www/autodox"
LOG_FILE="/var/log/autodox/deploy.log"
BACKUP_DIR="/var/backups/autodox"

# Ensure log and backup directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Root warning
if [ "$EUID" -eq 0 ]; then
    log "WARNING: Running as root. Consider using a non-root user."
fi

log "====== Starting Autodox Deployment ======"
log "Working directory: $APP_DIR"

# Change to app directory
cd "$APP_DIR" || error_exit "Failed to change to app directory"

# 1. Backup current build before deploying
log "Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -d ".output" ]; then
	tar -czf "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" .output
	log "✓ Backup created: app_$TIMESTAMP.tar.gz"
fi

# 2. Fetch latest code from master
log "Stashing local changes..."
git stash
log "Pulling latest code from master..."
git pull origin master || error_exit "Failed to pull from git"
log "✓ Code updated successfully"

# 3. Install dependencies (production only)
log "Installing dependencies with npm..."
npm install || error_exit "Failed to install dependencies"
log "✓ Dependencies installed"

# 4. Run committed database migrations
log "Running committed database migrations..."
npx drizzle-kit migrate || error_exit "Failed to run migrations"
log "✓ Migrations completed"

# 5. Build application
log "Building application..."
npm run build || error_exit "Failed to build application"
log "✓ Build completed successfully"

# 6. Restart PM2 app (with fallback for first deploy)
log "Restarting application with PM2..."
pm2 delete autodox 2>/dev/null; pm2 start ecosystem.config.cjs
pm2 save
log "✓ Application restarted"

# 7. Health check
log "Running health check..."
sleep 5
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH_CHECK" -eq 200 ]; then
    log "✓ Health check passed"
else
    error_exit "Health check failed! HTTP status: $HEALTH_CHECK"
fi

# 8. Cleanup old backups (keep last 5)
log "Cleaning up old backups..."
ls -t "$BACKUP_DIR"/app_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

log "====== Deployment completed successfully ======"
exit 0

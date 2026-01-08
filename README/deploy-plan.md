# Autodox Deployment Plan

## VPS Provider Recommendation

**Recommended:** Hetzner Cloud CPX11 (~$4.50/month) or DigitalOcean Basic Droplet ($6/month)

- **Hetzner** offers better price/performance (2 vCPU, 2GB RAM, 40GB SSD)
- **DigitalOcean** has simpler UI and better documentation (1 vCPU, 1GB RAM, 25GB SSD)

Both are suitable for this application. Choose based on your location (Hetzner for EU, DigitalOcean for broader availability).

## Server Specifications

- **OS:** Ubuntu 22.04 LTS
- **RAM:** Minimum 1GB (2GB recommended)
- **Storage:** 25GB+ SSD
- **Location:** Choose closest to your users

---

## Deployment Architecture

```
[Internet]
    ↓
[Nginx Reverse Proxy] :80, :443
    ↓
[Nuxt 4 App] :3000
    ↓
[MySQL Database] :3306 (localhost only)
    ↓
[Daily Backup] → /backups/
```

---

## Step-by-Step Deployment Guide

### 1. Initial Server Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Create non-root user
adduser admin
usermod -aG sudo autodox

# Log out and log back in using the new user you created

# Install nginx
sudo apt install -y nginx

# Setup firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable

# Switch to new user
su - autodox
```

### 2. Install Dependencies

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Load NVM without restarting the terminal
\. "$HOME/.nvm/nvm.sh"
# Download and install Node.js:
nvm install 24
# Verify the Node.js version:
node -v # Should print "v24.12.0".
# Verify npm version:
npm -v # Should print "11.6.2".


# Install MySQL
sudo apt install -y mysql-server

# Install PM2 (process manager)
npm install -g pm2
```

### 3. MySQL Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation
# - Set root password
# - Remove anonymous users: Yes
# - Disallow root login remotely: Yes
# - Remove test database: Yes
# - Reload privilege tables: Yes

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE autodox CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'autodox'@'localhost' IDENTIFIED BY 'Y75ZPleHmLnABOK';
GRANT ALL PRIVILEGES ON autodox.* TO 'autodox'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/autodox
sudo chown admin /var/www/autodox

# Clone repository (shallow clone - no history, master branch only)
cd /var/www/autodox
sudo git clone --depth 1 --single-branch --branch master https://github.com/yakir-reznik/autodox.git .

# Alternative: Upload files directly without git (no version control on server)
# From your local machine:
# rsync -avz --exclude 'node_modules' --exclude '.git' /path/to/local/autodox/ autodox@your-server-ip:/var/www/autodox/

# Install dependencies
npm install

# Create .env file
nano .env
```

**.env configuration:**

```env
# Database
DATABASE_URL=mysql://autodox:YOUR_DB_PASSWORD@localhost:3306/autodox
NUXT_SESSION_PASSWORD=SOME_STRONG_PASSWORD_123123

# App
NODE_ENV=production
NUXT_HOST=0.0.0.0
NUXT_PORT=3000

```

```bash
# Run database migrations
npx drizzle-kit generate
npx drizzle-kit migrate

# Create admin user
npx tsx scripts/create-admin.ts yakir.reznik@gmail.com some-password-123

# Build application
npm run build

# Test the build
node .output/server/index.mjs
# Press Ctrl+C after confirming it works
```

### 5. Setup PM2 Process Manager

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: "autodox",
      script: ".output/server/index.mjs",
      cwd: "/var/www/autodox",
      instances: 1,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/autodox/error.log",
      out_file: "/var/log/autodox/out.log",
      time: true,
    },
  ],
};
```

```bash
# Create log directory
sudo mkdir -p /var/log/autodox
sudo chown autodox:autodox /var/log/autodox

# Start app with PM2
pm2 start ecosystem.config.js

# Configure PM2 to start on boot
pm2 startup systemd
# Run the command that PM2 outputs

pm2 save
```

### 6. Configure Nginx Reverse Proxy

```bash
# Create nginx configuration
sudo nano /etc/nginx/sites-available/autodox
```

**Nginx configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/autodox /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 7. Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 8. Setup Daily Database Backup

```bash
# Create backup directory
sudo mkdir -p /var/backups/autodox
sudo chown autodox:autodox /var/backups/autodox

# Create backup script
nano ~/backup-db.sh
```

**backup-db.sh:**

```bash
#!/bin/bash

# Configuration
DB_USER="autodox"
DB_PASS="YOUR_DB_PASSWORD"
DB_NAME="autodox"
BACKUP_DIR="/var/backups/autodox"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/autodox_$DATE.sql.gz"

# Create backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "autodox_*.sql.gz" -type f -mtime +30 -delete

# Log backup
echo "$(date): Backup completed - $BACKUP_FILE" >> $BACKUP_DIR/backup.log
```

```bash
# Make script executable
chmod +x ~/backup-db.sh

# Add to crontab (runs daily at 2 AM)
crontab -e
```

**Add this line to crontab:**

```
0 2 * * * /home/autodox/backup-db.sh
```

---

## Deployment Update Procedure

When you need to update the application:

### Option 1: Using Git (Shallow Clone)

```bash
# SSH into server
ssh autodox@your-server-ip

# Navigate to app directory
cd /var/www/autodox

# Fetch and reset to latest master (works with shallow clones)
git fetch origin master
git reset --hard origin/master

# Install any new dependencies
pnpm install

# Run any new migrations
npx drizzle-kit migrate

# Rebuild application
pnpm build

# Restart PM2 (zero-downtime)
pm2 reload autodox

# Check status
pm2 status
pm2 logs autodox --lines 50
```

### Option 2: Using rsync (No Git Required)

```bash
# From your LOCAL machine, sync files to server
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.env' \
  /path/to/local/autodox/ autodox@your-server-ip:/var/www/autodox/

# Then SSH into server and restart
ssh autodox@your-server-ip "cd /var/www/autodox && pnpm install && npx drizzle-kit migrate && pnpm build && pm2 reload autodox"
```

**Benefits:**

- **Git method:** Simple, can track what's deployed
- **Rsync method:** No git on server, slightly faster, smaller disk footprint

**Note:** Both methods preserve your `.env` file and database

---

## Backup and Recovery

### Manual Backup

```bash
cd /var/backups/autodox
mysqldump -u autodox -p autodox | gzip > manual_backup_$(date +%Y%m%d).sql.gz
```

### Restore from Backup

```bash
# Stop the application
pm2 stop autodox

# Restore database
gunzip < /var/backups/autodox/autodox_YYYYMMDD_HHMMSS.sql.gz | mysql -u autodox -p autodox

# Start the application
pm2 start autodox
```

### Download Backups to Local Machine

```bash
# On your local machine
scp autodox@your-server-ip:/var/backups/autodox/autodox_*.sql.gz ./backups/
```

---

## Monitoring and Maintenance

### Check Application Status

```bash
pm2 status
pm2 logs autodox
pm2 monit
```

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

### Check MySQL Status

```bash
sudo systemctl status mysql
sudo mysql -u autodox -p -e "SHOW PROCESSLIST;"
```

### Check Disk Space

```bash
df -h
du -sh /var/backups/autodox
```

### View Recent Backups

```bash
ls -lh /var/backups/autodox
tail /var/backups/autodox/backup.log
```

---

## Security Checklist

- [ ] Change default MySQL root password
- [ ] Use strong passwords for all accounts
- [ ] Keep SSH key-based authentication enabled
- [ ] Configure firewall (UFW) to only allow necessary ports
- [ ] Keep system updated: `sudo apt update && sudo apt upgrade`
- [ ] Enable automatic security updates
- [ ] Configure fail2ban to prevent brute force attacks (optional)
- [ ] Regularly review PM2 and Nginx logs
- [ ] Store backups off-server (optional but recommended)

---

## Estimated Deployment Time

- **Initial setup:** 30-45 minutes
- **Updates:** 2-5 minutes

---

## Cost Breakdown (Monthly)

- VPS (Hetzner/DigitalOcean): $4.50-$6.00
- Domain name: ~$1.00/month (if needed)
- **Total:** ~$5.50-$7.00/month

---

## Troubleshooting

### App not starting

```bash
pm2 logs autodox --lines 100
# Check for errors in the logs
```

### Database connection issues

```bash
# Verify MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u autodox -p -e "SELECT 1;"
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Out of disk space

```bash
# Check disk usage
df -h

# Clean old backups
find /var/backups/autodox -name "autodox_*.sql.gz" -type f -mtime +7 -delete

# Clean PM2 logs
pm2 flush
```

---

## Alternative: Docker Deployment (Optional)

If you prefer containerization, consider using Docker Compose with separate containers for Nuxt and MySQL. This provides better isolation and easier migration but requires slightly more resources.

This traditional deployment approach is recommended for a $5 VPS as it's more resource-efficient.

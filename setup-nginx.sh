#!/bin/bash
# Nginx and Let's Encrypt Certbot Setup Script for app.sparkanalytic.com
# Run this script on your EC2 instance!

set -e

DOMAIN="app.sparkanalytic.com"
PORT=3000

echo "===================================================="
echo "Starting Nginx and SSL (Certbot) Setup for $DOMAIN"
echo "===================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script as root or with sudo:"
  echo "sudo ./setup-nginx.sh"
  exit 1
fi

# Detect OS
if [ -f /etc/debian_version ]; then
    OS="Debian"
    echo "Detected Debian/Ubuntu-based system."
elif [ -f /etc/redhat-release ] || [ -f /etc/system-release ]; then
    OS="RedHat"
    echo "Detected RedHat/CentOS/Amazon Linux system."
else
    OS="Unknown"
    echo "Unknown OS. Proceeding with generic apt setup..."
fi

# Install Nginx and Certbot
if [ "$OS" = "Debian" ]; then
    echo "Updating packages and installing Nginx, Certbot..."
    apt-get update -y
    apt-get install -y nginx certbot python3-certbot-nginx
elif [ "$OS" = "RedHat" ]; then
    echo "Installing Nginx and Certbot via yum/dnf..."
    # Enable EPEL if needed
    if command -v amazon-linux-extras >/dev/null 2>&1; then
        amazon-linux-extras enable epel -y
    fi
    yum update -y
    yum install -y epel-release
    yum install -y nginx certbot python3-certbot-nginx || yum install -y nginx certbot-nginx
else
    echo "Please ensure Nginx and Certbot are installed on your system."
fi

# Create Nginx configuration
echo "Configuring Nginx reverse proxy to port $PORT for $DOMAIN..."

NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"
if [ ! -d /etc/nginx/sites-available ]; then
    # Some RedHat/Amazon Linux setups don't use sites-available by default, so we use conf.d
    NGINX_CONF="/etc/nginx/conf.d/$DOMAIN.conf"
fi

cat <<EOT > "$NGINX_CONF"
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOT

# Link configuration if using sites-enabled
if [ -d /etc/nginx/sites-enabled ]; then
    rm -f "/etc/nginx/sites-enabled/$DOMAIN"
    ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "Restarting Nginx..."
systemctl restart nginx || service nginx restart

# Run Certbot to acquire and install SSL certificate
echo "===================================================="
echo "Running Certbot for Let's Encrypt SSL on $DOMAIN..."
echo "===================================================="
certbot --nginx -d "$DOMAIN"

echo "===================================================="
echo "SSL Setup Completed Successfully!"
echo "Nginx is now proxying HTTPS traffic for $DOMAIN to port $PORT."
echo "===================================================="

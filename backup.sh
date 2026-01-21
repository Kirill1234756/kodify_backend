#!/bin/bash

# Backup script for Kodify backend
# This script backs up:
# 1. PostgreSQL database
# 2. Uploaded files (uploads directory)

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting backup process...${NC}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database backup
echo -e "${YELLOW}📦 Backing up database...${NC}"

DB_NAME="${DB_NAME:-kodify_db}"
DB_USER="${DB_USER:-kodify_user}"
DB_HOST="${DB_HOST:-postgres}"

# Create database dump
DB_BACKUP_FILE="$BACKUP_DIR/database_${TIMESTAMP}.sql.gz"

if docker-compose exec -T postgres pg_dump -U "$DB_USER" -d "$DB_NAME" 2>/dev/null | gzip > "$DB_BACKUP_FILE"; then
    DB_SIZE=$(du -h "$DB_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Database backup created: $DB_BACKUP_FILE (${DB_SIZE})${NC}"
else
    echo -e "${RED}❌ Database backup failed!${NC}"
    exit 1
fi

# Files backup
echo -e "${YELLOW}📁 Backing up uploaded files...${NC}"

FILES_BACKUP_FILE="$BACKUP_DIR/uploads_${TIMESTAMP}.tar.gz"

if docker-compose exec -T backend tar -czf - /app/uploads 2>/dev/null > "$FILES_BACKUP_FILE"; then
    FILES_SIZE=$(du -h "$FILES_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Files backup created: $FILES_BACKUP_FILE (${FILES_SIZE})${NC}"
else
    echo -e "${YELLOW}⚠️  Files backup skipped (uploads directory might be empty or not exist)${NC}"
fi

# Create backup info file
INFO_FILE="$BACKUP_DIR/backup_info_${TIMESTAMP}.txt"
cat > "$INFO_FILE" << EOF
Backup Information
==================
Date: $(date)
Timestamp: $TIMESTAMP

Database:
- Name: $DB_NAME
- User: $DB_USER
- Host: $DB_HOST
- Backup file: database_${TIMESTAMP}.sql.gz

Files:
- Backup file: uploads_${TIMESTAMP}.tar.gz

Backup location: $BACKUP_DIR
EOF

echo -e "${GREEN}✅ Backup info saved: $INFO_FILE${NC}"

# List backups
echo -e "\n${GREEN}📋 Current backups:${NC}"
ls -lh "$BACKUP_DIR" | grep -E "(database_|uploads_|backup_info_)" | tail -9

# Cleanup old backups (keep last 30 days)
echo -e "\n${YELLOW}🧹 Cleaning up old backups (older than 30 days)...${NC}"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "backup_info_*.txt" -mtime +30 -delete 2>/dev/null || true

echo -e "${GREEN}✅ Backup process completed!${NC}"
echo -e "${GREEN}📍 Backup location: $(pwd)/$BACKUP_DIR${NC}"

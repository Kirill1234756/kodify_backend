#!/bin/bash

# Restore script for Kodify backend
# This script restores:
# 1. PostgreSQL database
# 2. Uploaded files (uploads directory)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  WARNING: This will overwrite existing data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Restore cancelled.${NC}"
    exit 1
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME="${DB_NAME:-kodify_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-postgres}"

# Ask for backup file
echo -e "\n${GREEN}Available database backups:${NC}"
ls -1t ./backups/database_*.sql.gz 2>/dev/null | head -10 | nl

read -p "Enter backup number to restore (or full path): " BACKUP_NUM

if [[ "$BACKUP_NUM" =~ ^[0-9]+$ ]]; then
    DB_BACKUP=$(ls -1t ./backups/database_*.sql.gz 2>/dev/null | sed -n "${BACKUP_NUM}p")
else
    DB_BACKUP="$BACKUP_NUM"
fi

if [ ! -f "$DB_BACKUP" ]; then
    echo -e "${RED}❌ Backup file not found: $DB_BACKUP${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Restoring database from: $DB_BACKUP${NC}"

# Restore database
gunzip -c "$DB_BACKUP" | docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" > /dev/null

echo -e "${GREEN}✅ Database restored!${NC}"

# Ask for files backup
read -p "Do you want to restore uploaded files? (yes/no): " RESTORE_FILES

if [ "$RESTORE_FILES" = "yes" ]; then
    echo -e "\n${GREEN}Available file backups:${NC}"
    ls -1t ./backups/uploads_*.tar.gz 2>/dev/null | head -10 | nl
    
    read -p "Enter backup number to restore (or full path): " FILES_NUM
    
    if [[ "$FILES_NUM" =~ ^[0-9]+$ ]]; then
        FILES_BACKUP=$(ls -1t ./backups/uploads_*.tar.gz 2>/dev/null | sed -n "${FILES_NUM}p")
    else
        FILES_BACKUP="$FILES_NUM"
    fi
    
    if [ ! -f "$FILES_BACKUP" ]; then
        echo -e "${RED}❌ Backup file not found: $FILES_BACKUP${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}📁 Restoring files from: $FILES_BACKUP${NC}"
    
    # Extract files to container
    cat "$FILES_BACKUP" | docker-compose exec -T backend tar -xzf - -C /
    
    echo -e "${GREEN}✅ Files restored!${NC}"
fi

echo -e "\n${GREEN}✅ Restore completed!${NC}"
echo -e "${YELLOW}💡 Don't forget to restart the backend: docker-compose restart backend${NC}"

#!/bin/bash

BACKUP_DIR="backup"
DATE=$(date +%Y%m%d)

mkdir -p $BACKUP_DIR

pg_dump -U postgres db1 > $BACKUP_DIR/backup_$DATE.sql
cp backend/.env $BACKUP_DIR/.env_$DATE

find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name ".env_*" -mtime +7 -delete

echo "Backup completed: $DATE"
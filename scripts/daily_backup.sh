#!/bin/bash

set -e

PROJECT_DIR="/home/ubuntu/Customer-retention-system"
BACKUP_DIR="$PROJECT_DIR/backups"
S3_BUCKET="s3://customer-retention-backup-2026"

DATE=$(TZ=Asia/Kathmandu date +"%Y-%m-%d")
TIMESTAMP=$(TZ=Asia/Kathmandu date +"%Y-%m-%d_%H-%M-%S")

DB_BACKUP="$BACKUP_DIR/database/retention_db_${TIMESTAMP}.sql.gz"
REPORT_BACKUP="$BACKUP_DIR/reports/retention_${TIMESTAMP}.csv.gz"

mkdir -p "$BACKUP_DIR/database" "$BACKUP_DIR/reports"

echo "===== Retention Backup: $TIMESTAMP ====="

echo "[1/6] PostgreSQL backup..."

docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T db \
  pg_dump -U postgres -d retention_db \
  | gzip > "$DB_BACKUP"

echo "Database backup created:"
ls -lh "$DB_BACKUP"


echo "[2/6] Retention workflow export..."

docker compose -f "$PROJECT_DIR/docker-compose.yml" exec -T backend \
  python manage.py export_retention_backup \
  --output "/tmp/retention_${TIMESTAMP}.csv"

docker compose -f "$PROJECT_DIR/docker-compose.yml" cp \
  backend:/tmp/retention_${TIMESTAMP}.csv \
  "$BACKUP_DIR/reports/retention_${TIMESTAMP}.csv"

gzip "$BACKUP_DIR/reports/retention_${TIMESTAMP}.csv"

echo "Report backup created:"
ls -lh "$REPORT_BACKUP"


echo "[3/6] Removing local backups older than 30 days..."

find "$BACKUP_DIR/database" -type f -mtime +30 -delete
find "$BACKUP_DIR/reports" -type f -mtime +30 -delete


echo "[4/6] Uploading today's database backup to S3..."

aws s3 cp \
  "$DB_BACKUP" \
  "$S3_BUCKET/database/"

echo "Database backup uploaded."


echo "[5/6] Uploading today's retention report to S3..."

aws s3 cp \
  "$REPORT_BACKUP" \
  "$S3_BUCKET/reports/"

echo "Retention report uploaded."


echo "[6/6] Backup verification..."

echo "Today's S3 database backup:"
aws s3 ls "$S3_BUCKET/database/$(basename "$DB_BACKUP")"

echo "Today's S3 retention report:"
aws s3 ls "$S3_BUCKET/reports/$(basename "$REPORT_BACKUP")"

echo
echo "===== BACKUP SUCCESS ====="
echo "Timestamp: $TIMESTAMP"
echo "Database:  $DB_BACKUP"
echo "Report:    $REPORT_BACKUP"
echo "S3 Bucket: $S3_BUCKET"

#!/usr/bin/env bash
# ==============================================================================
# BEMMS Database Backup Script
# Usage: ./scripts/backup-db.sh [container_name] [db_user] [db_name]
# ==============================================================================
set -euo pipefail

CONTAINER="${1:-bemms_prod_db}"
DB_USER="${2:-bemms}"
DB_NAME="${3:-bemms_db}"
BACKUP_DIR="${4:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="${BACKUP_DIR}/bemms_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[BEMMS Backup] Starting backup of database '${DB_NAME}' from container '${CONTAINER}'..."

docker exec "${CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${FILENAME}"

echo "[BEMMS Backup] Backup completed successfully: ${FILENAME}"
echo "[BEMMS Backup] Backup size: $(du -h "${FILENAME}" | cut -f1)"

# Prune backups older than 30 days
echo "[BEMMS Backup] Cleaning up backups older than 30 days..."
find "${BACKUP_DIR}" -name "bemms_backup_*.sql.gz" -type f -mtime +30 -delete

echo "[BEMMS Backup] Done."

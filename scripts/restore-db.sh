#!/usr/bin/env bash
# ==============================================================================
# BEMMS Database Restore Script
# Usage: ./scripts/restore-db.sh <path_to_backup.sql.gz> [container_name] [db_user] [db_name]
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path_to_backup.sql.gz> [container_name] [db_user] [db_name]"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="${2:-bemms_prod_db}"
DB_USER="${3:-bemms}"
DB_NAME="${4:-bemms_db}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found!"
  exit 1
fi

echo "WARNING: This will overwrite database '${DB_NAME}' in container '${CONTAINER}'!"
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[BEMMS Restore] Restoring from '${BACKUP_FILE}'..."

gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo "[BEMMS Restore] Database restore complete."

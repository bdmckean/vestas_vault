#!/usr/bin/env bash
# Run the spouse SS / default scenario age migration. Use when you see 500 on Social Security page.
# Prefer running via backend so we use the same DATABASE_URL as the app.
set -e
cd "$(dirname "$0")/.."
echo "Running migration (via backend so same DB as app)..."
if docker compose exec -T backend python -m scripts.run_spouse_ss_migration 2>/dev/null; then
  echo "Migration finished. Reload the Social Security page."
  exit 0
fi
echo "Backend container not available, trying psql against db..."
if [ -f .env ]; then
  set -a
  # shellcheck source=/dev/null
  source .env
  set +a
fi
USER="${POSTGRES_USER:-retirement_user}"
DB="${POSTGRES_DB:-retirement_planner}"
docker compose exec -T db psql -U "$USER" -d "$DB" -f - < backend/scripts/add_spouse_ss_columns.sql
echo "Migration finished. Reload the Social Security page."

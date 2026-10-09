#!/bin/sh
set -e

echo "Waiting for database..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$POSTGRES_USER" >/dev/null 2>&1; do
  sleep 1
done
echo "Database is ready."

echo "UPDATE \"User\" SET \"avatarUrl\" = 'default.png' WHERE \"avatarUrl\" IS NULL;" \
  | npx prisma db execute --stdin >/dev/null 2>&1 || true

npx prisma db push

exec "$@"

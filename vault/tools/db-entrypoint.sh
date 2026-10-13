#!/bin/sh
set -e

if [ ! -s "$PGDATA/PG_VERSION" ]; then
	APPROLE_DIR=/vault/approle

	login=$(wget -q -O - \
		--post-data "{\"role_id\":\"$(cat "$APPROLE_DIR/role_id")\",\"secret_id\":\"$(cat "$APPROLE_DIR/secret_id")\"}" \
		"$VAULT_ADDR/v1/auth/approle/login")
	token=$(echo "$login" | sed -n 's/.*"client_token":"\([^"]*\)".*/\1/p')

	secret=$(wget -q -O - --header "X-Vault-Token: $token" "$VAULT_ADDR/v1/secret/data/database")
	config=$(wget -q -O - --header "X-Vault-Token: $token" "$VAULT_ADDR/v1/secret/data/database-config")
	POSTGRES_PASSWORD=$(echo "$secret" | sed -n 's/.*"POSTGRES_PASSWORD":"\([^"]*\)".*/\1/p')
	POSTGRES_USER=$(echo "$config" | sed -n 's/.*"POSTGRES_USER":"\([^"]*\)".*/\1/p')
	POSTGRES_DB=$(echo "$config" | sed -n 's/.*"POSTGRES_DB":"\([^"]*\)".*/\1/p')

	if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
		echo "Could not read the database settings from Vault" >&2
		exit 1
	fi
	export POSTGRES_PASSWORD POSTGRES_USER POSTGRES_DB
fi

exec docker-entrypoint.sh "$@"

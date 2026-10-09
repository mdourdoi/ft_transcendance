#!/bin/sh
set -e

KEYS_DIR=/vault/keys

if vault status | grep -q "Initialized *false"; then
	vault operator init -key-shares=1 -key-threshold=1 > /tmp/init.txt
	awk '/Unseal Key 1:/ {print $NF}' /tmp/init.txt > "$KEYS_DIR/unseal_key"
	awk '/Initial Root Token:/ {print $NF}' /tmp/init.txt > "$KEYS_DIR/root_token"
	chmod 600 "$KEYS_DIR/unseal_key" "$KEYS_DIR/root_token"
	rm /tmp/init.txt
fi

if vault status | grep -q "Sealed *true"; then
	vault operator unseal "$(cat "$KEYS_DIR/unseal_key")" > /dev/null
fi

export VAULT_TOKEN="$(cat "$KEYS_DIR/root_token")"

if ! vault secrets list | grep -q "^secret/"; then
	vault secrets enable -path=secret kv-v2 > /dev/null
fi

SMTP_PASS=$(sed -n 's/^SMTP_PASS=//p' /run/secrets/env)
if [ -z "$SMTP_PASS" ]; then
	echo "SMTP_PASS is missing in .env" >&2
	exit 1
fi
printf '%s' "$SMTP_PASS" | vault kv put secret/smtp SMTP_PASS=- > /dev/null

if ! vault kv get secret/backend > /dev/null 2>&1; then
	vault kv put secret/backend \
		JWT_SECRET="$(head -c 32 /dev/urandom | xxd -p -c 64)" \
		TWOFA_ENCRYPTION_KEY="$(head -c 32 /dev/urandom | xxd -p -c 64)" > /dev/null
fi

if ! vault kv get secret/database > /dev/null 2>&1; then
	vault kv put secret/database \
		POSTGRES_PASSWORD="$(head -c 32 /dev/urandom | xxd -p -c 64)" > /dev/null
fi

vault kv put secret/backend-config \
	APP_URL=https://localhost:8443 \
	CORS_ORIGIN=https://localhost:8443 \
	SMTP_HOST=smtp.gmail.com \
	SMTP_PORT=587 \
	SMTP_USER=onitama.transcendance@gmail.com \
	MAIL_FROM="Onitama <onitama.transcendance@gmail.com>" > /dev/null

vault kv put secret/database-config \
	POSTGRES_USER=transcendence \
	POSTGRES_DB=transcendence > /dev/null

if ! vault auth list | grep -q "^approle/"; then
	vault auth enable approle > /dev/null
fi

vault policy write backend /vault/policies/backend.hcl > /dev/null
vault write auth/approle/role/backend \
	token_policies=backend token_ttl=3m secret_id_num_uses=0 secret_id_ttl=0 > /dev/null
vault read -field=role_id auth/approle/role/backend/role-id > /vault/approle-backend/role_id
if [ ! -f /vault/approle-backend/secret_id ]; then
	vault write -f -field=secret_id auth/approle/role/backend/secret-id > /vault/approle-backend/secret_id
	chmod 600 /vault/approle-backend/secret_id
fi

vault policy write database /vault/policies/database.hcl > /dev/null
vault write auth/approle/role/database \
	token_policies=database token_ttl=3m secret_id_num_uses=0 secret_id_ttl=0 > /dev/null
vault read -field=role_id auth/approle/role/database/role-id > /vault/approle-database/role_id
if [ ! -f /vault/approle-database/secret_id ]; then
	vault write -f -field=secret_id auth/approle/role/database/secret-id > /vault/approle-database/secret_id
	chmod 600 /vault/approle-database/secret_id
fi

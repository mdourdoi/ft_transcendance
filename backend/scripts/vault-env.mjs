import { readFileSync } from 'node:fs';

const VAULT_ADDR = process.env.VAULT_ADDR;
const APPROLE_DIR = '/vault/approle';

function readCredential(fileName) {
  const content = readFileSync(`${APPROLE_DIR}/${fileName}`, 'utf8');
  return content.trim();
}

async function callVault(path, options) {
  const response = await fetch(`${VAULT_ADDR}/v1/${path}`, options);
  if (!response.ok) {
    throw new Error(`Vault ${path}: HTTP ${response.status}`);
  }
  return response.json();
}

async function login() {
  const credentials = {
    role_id: readCredential('role_id'),
    secret_id: readCredential('secret_id'),
  };
  const result = await callVault('auth/approle/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  return result.auth.client_token;
}

async function readSecrets(token, path) {
  const result = await callVault(`secret/data/${path}`, {
    headers: { 'X-Vault-Token': token },
  });
  return result.data.data;
}

function printAsShellExports(secrets) {
  for (const [name, value] of Object.entries(secrets)) {
    const escapedValue = value.replaceAll("'", "'\\''");
    console.log(`export ${name}='${escapedValue}'`);
  }
}

const token = await login();
const paths = ['backend', 'backend-config', 'database', 'database-config', 'smtp'];
for (const path of paths) {
  printAsShellExports(await readSecrets(token, path));
}

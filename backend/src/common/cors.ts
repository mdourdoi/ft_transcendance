const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function corsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) {
    return DEFAULT_ORIGINS;
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function resolveCorsOrigin(
  _requestOrigin: string | undefined,
  callback: (error: Error | null, origins: string[]) => void,
): void {
  callback(null, corsOrigins());
}

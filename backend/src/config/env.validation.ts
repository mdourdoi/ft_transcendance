import { ErrorCode } from '../common/error-codes.js';

export function validateEnv(config: Record<string, unknown>) {
  const key = config.TWOFA_ENCRYPTION_KEY;
  if (typeof key !== 'string' || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(ErrorCode.BAD_TWOFA_KEY);
  }
  if (typeof config.JWT_SECRET !== 'string' || config.JWT_SECRET.length < 32) {
    throw new Error(ErrorCode.BAD_JWT_SECRET);
  }
  if (config.SMTP_HOST) {
    for (const k of ['SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM']) {
      if (typeof config[k] !== 'string' || !config[k]) {
        throw new Error(ErrorCode.BAD_SMTP_CONFIG);
      }
    }
  }
  if (typeof config.APP_URL !== 'string' || !config.APP_URL)
    throw new Error(ErrorCode.BAD_APP_URL);
  return config;
}

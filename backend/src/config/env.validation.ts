import { ErrorCode } from '../common/error-codes';

export function validateEnv(config: Record<string, unknown>) {
  const key = config.TWOFA_ENCRYPTION_KEY;
  if (typeof key !== 'string' || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(ErrorCode.BAD_TWOFA_KEY);
  }
  if (typeof config.JWT_SECRET !== 'string' || config.JWT_SECRET.length < 32) {
    throw new Error(ErrorCode.BAD_JWT_SECRET);
  }
  return config;
}

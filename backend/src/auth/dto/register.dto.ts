import { Transform } from 'class-transformer';
import {
  Equals,
  IsAlphanumeric,
  IsBoolean,
  IsEmail,
  IsString,
  IsStrongPassword,
  Length,
  MinLength,
} from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: ErrorCode.INVALID_EMAIL })
  email: string;
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  @Length(3, 24, { message: ErrorCode.INVALID_USERNAME })
  @IsAlphanumeric(undefined, { message: ErrorCode.INVALID_USERNAME })
  username: string;
  @IsString({ message: ErrorCode.INVALID_PASSWORD })
  @MinLength(8, { message: ErrorCode.WEAK_PASSWORD })
  @IsStrongPassword(
    {
      minLength: 8,
      minUppercase: 1,
      minLowercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    { message: ErrorCode.WEAK_PASSWORD },
  )
  password: string;
  @IsBoolean({ message: ErrorCode.CONSENT_REQUIRED })
  @Equals(true, { message: ErrorCode.CONSENT_REQUIRED })
  acceptTerms: boolean;
}

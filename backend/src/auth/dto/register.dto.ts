import {
  IsEmail,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ErrorCode } from '../../common/error-codes';

export class RegisterDto {
  @IsEmail({}, { message: ErrorCode.INVALID_EMAIL })
  email: string;
  @IsString({ message: ErrorCode.INVALID_USERNAME })
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
}

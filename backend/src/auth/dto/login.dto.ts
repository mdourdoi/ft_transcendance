import { IsOptional, IsString, Length } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class LoginDto {
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  username: string;
  @IsString({ message: ErrorCode.INVALID_PASSWORD })
  password: string;
  @IsString({ message: ErrorCode.INVALID_TWOFA_CODE })
  @Length(6, 6, { message: ErrorCode.INVALID_TWOFA_CODE })
  @IsOptional()
  code?: string;
}

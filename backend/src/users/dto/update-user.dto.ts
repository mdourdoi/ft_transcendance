import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ErrorCode } from '../../common/error-codes';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: ErrorCode.INVALID_EMAIL })
  email?: string;
  @IsOptional()
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  username?: string;
}

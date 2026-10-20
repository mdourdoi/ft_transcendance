import { IsAlphanumeric, IsOptional, IsString, Length } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  @Length(3, 24, { message: ErrorCode.INVALID_USERNAME })
  @IsAlphanumeric(undefined, { message: ErrorCode.INVALID_USERNAME })
  username?: string;
}

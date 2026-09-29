import { Transform } from 'class-transformer';
import {
  IsAlphanumeric,
  IsEmail,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: ErrorCode.INVALID_EMAIL })
  email?: string;
  @IsOptional()
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  @Length(3, 24, { message: ErrorCode.INVALID_USERNAME })
  @IsAlphanumeric(undefined, { message: ErrorCode.INVALID_USERNAME })
  username?: string;
}

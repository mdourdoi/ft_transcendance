import { IsAlphanumeric, IsString, Length } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class SearchUsersDto {
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  @Length(1, 24, { message: ErrorCode.INVALID_USERNAME })
  @IsAlphanumeric(undefined, { message: ErrorCode.INVALID_USERNAME })
  q: string;
}

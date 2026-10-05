import { IsAlphanumeric, IsString, Length } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class FriendRequestDto {
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  @Length(3, 24, { message: ErrorCode.INVALID_USERNAME })
  @IsAlphanumeric(undefined, { message: ErrorCode.INVALID_USERNAME })
  public username: string;
}

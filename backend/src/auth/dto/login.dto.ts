import { IsString } from 'class-validator';
import { ErrorCode } from '../../common/error-codes';

export class LoginDto {
  @IsString({ message: ErrorCode.INVALID_USERNAME })
  username: string;
  @IsString({ message: ErrorCode.INVALID_PASSWORD })
  password: string;
}

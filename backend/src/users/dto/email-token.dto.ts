import { IsNotEmpty, IsString } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class EmailTokenDto {
  @IsString({ message: ErrorCode.INVALID_TOKEN })
  @IsNotEmpty({ message: ErrorCode.INVALID_TOKEN })
  token: string;
}

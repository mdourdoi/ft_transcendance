import { IsString, Length } from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class TwofaCodeDto {
  @IsString({ message: ErrorCode.INVALID_TWOFA_CODE })
  @Length(6, 6, { message: ErrorCode.INVALID_TWOFA_CODE })
  code: string;
}

import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';

export class SendMessageDto {
  @IsInt({ message: ErrorCode.INVALID_CONVERSATION_ID })
  @IsPositive({ message: ErrorCode.INVALID_CONVERSATION_ID })
  conversationId: number;
  @IsString({ message: ErrorCode.INVALID_MESSAGE })
  @IsNotEmpty({ message: ErrorCode.EMPTY_MESSAGE })
  @MaxLength(1024, { message: ErrorCode.INVALID_MESSAGE })
  content: string;
}

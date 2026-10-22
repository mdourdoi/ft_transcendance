import {
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';
import { ErrorCode } from '../../common/error-codes.js';
import { MAX_INT_ID } from '../../common/parse-id.pipe.js';

export class SendMessageDto {
  @IsInt({ message: ErrorCode.INVALID_CONVERSATION_ID })
  @IsPositive({ message: ErrorCode.INVALID_CONVERSATION_ID })
  @Max(MAX_INT_ID, { message: ErrorCode.INVALID_CONVERSATION_ID })
  conversationId: number;
  @IsString({ message: ErrorCode.INVALID_MESSAGE })
  @IsNotEmpty({ message: ErrorCode.EMPTY_MESSAGE })
  @MaxLength(1024, { message: ErrorCode.INVALID_MESSAGE })
  content: string;
}

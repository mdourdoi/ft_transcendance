import { Expose, Type } from 'class-transformer';
import { MessageDto } from './message.dto.js';

export class ConversationDto {
  @Expose() public nextCursor: string | null;
  @Expose() public hasMore: boolean;

  @Expose()
  @Type(() => MessageDto)
  public items: MessageDto[];
}

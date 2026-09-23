import { Expose, Type } from 'class-transformer';
import { FriendshipStatus } from '../../generated/prisma/client.js';
import { TinyUserDto } from '../../users/dto/tiny-user.dto.js';

export class FriendshipDto {
  @Expose() public status: FriendshipStatus;
  @Expose() public isSender: boolean | null;
  @Expose() public conversationId: number | null;

  @Expose()
  @Type(() => TinyUserDto)
  public user: TinyUserDto;
}

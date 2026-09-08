import { TinyUserDto } from '@/src/users/dto/tiny-user.dto';
import { FriendshipStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';

export class FriendshipDto {
  @Expose() public status: FriendshipStatus;
  @Expose() public isSender: boolean | null;
  @Expose() public conversationId: number;

  @Expose()
  @Type(() => TinyUserDto)
  public user: TinyUserDto;
}

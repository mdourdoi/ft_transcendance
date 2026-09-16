import { IsInt, IsPositive } from 'class-validator';

export class FriendRequestDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

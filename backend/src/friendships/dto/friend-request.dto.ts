import { IsNumber, IsPositive } from 'class-validator';

export class FriendRequestDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

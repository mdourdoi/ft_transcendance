import { IsInt, IsPositive } from 'class-validator';

export class RemoveFriendDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

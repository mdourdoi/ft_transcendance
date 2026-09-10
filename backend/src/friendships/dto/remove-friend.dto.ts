import { IsNumber, IsPositive } from 'class-validator';

export class RemoveFriendDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

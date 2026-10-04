import { IsInt, IsPositive } from 'class-validator';

export class GameInviteDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

import { IsInt, IsPositive } from 'class-validator';

export class AcceptRequestDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

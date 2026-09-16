import { IsInt, IsPositive } from 'class-validator';

export class DenyRequestDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

import { IsNumber, IsPositive } from 'class-validator';

export class DenyRequestDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

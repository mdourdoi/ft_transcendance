import { IsNumber, IsPositive } from 'class-validator';

export class UnblockUserDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

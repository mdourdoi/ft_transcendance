import { IsNumber, IsPositive } from 'class-validator';

export class BlockUserDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

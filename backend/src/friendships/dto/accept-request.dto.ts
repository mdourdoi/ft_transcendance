import { IsNumber, IsPositive } from 'class-validator';

export class AcceptRequestDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

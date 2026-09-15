import { IsNumber, IsPositive } from 'class-validator';

export class CancelPendingRequestDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public targetId: number;
}

import { IsInt, IsPositive } from 'class-validator';

export class CancelPendingRequestDto {
  @IsInt()
  @IsPositive()
  public targetId: number;
}

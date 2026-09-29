import { IsInt } from 'class-validator';

export class ReportMatchResultDto {
  @IsInt()
  winnerId: number;
}

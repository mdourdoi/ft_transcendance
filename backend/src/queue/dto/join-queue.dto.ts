import { QueueMode } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class JoinQueueDto {
  @IsEnum(QueueMode)
  mode: QueueMode;
}

import { QueueMode } from '../../generated/prisma/client.js';
import { IsEnum } from 'class-validator';

export class JoinQueueDto {
  @IsEnum(QueueMode)
  mode: QueueMode;
}

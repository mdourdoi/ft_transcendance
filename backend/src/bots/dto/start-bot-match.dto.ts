import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { BOT_LEVELS } from '../bots.constants.js';

export class StartBotMatchDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(BOT_LEVELS.length)
  level?: number;
}

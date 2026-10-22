import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsPositive,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { MAX_INT_ID } from '../../common/parse-id.pipe.js';

export class GameActionDto {
  @IsInt()
  @IsPositive()
  @Max(MAX_INT_ID)
  matchId: number;
}

export class PositionDto {
  @IsInt()
  row: number;

  @IsInt()
  col: number;
}

export class PassTurnDto extends GameActionDto {
  @IsString()
  @IsNotEmpty()
  card: string;
}

export class PlayMoveDto extends PassTurnDto {
  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  from: PositionDto;

  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  to: PositionDto;
}

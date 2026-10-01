import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class GameActionDto {
  @IsInt()
  @IsPositive()
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

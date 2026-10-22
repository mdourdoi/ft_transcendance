import { IsInt, IsPositive, Max } from 'class-validator';
import { MAX_INT_ID } from '../../common/parse-id.pipe.js';

export class RemoveFriendDto {
  @IsInt()
  @IsPositive()
  @Max(MAX_INT_ID)
  public targetId: number;
}

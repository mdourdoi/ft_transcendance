import { Expose } from 'class-transformer';

export class SearchResultDto {
  @Expose() public id: number | null;
}

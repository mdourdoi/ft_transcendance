import { Expose } from 'class-transformer';

export class TinyUserDto {
  @Expose() public username: string;
  @Expose() public avatarUrl: string;

  constructor(data: TinyUserDto) {
    Object.assign(this, data);
  }
}

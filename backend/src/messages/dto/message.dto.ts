import { Expose, Type } from 'class-transformer';
import { TinyUserDto } from '../../users/dto/tiny-user.dto.js';

export class MessageDto {
  @Expose() public id: string;
  @Expose() public content: string;
  @Expose() public createdAt: Date;

  @Expose()
  @Type(() => TinyUserDto)
  public sender: TinyUserDto;

  constructor(partial: Partial<MessageDto>) {
    Object.assign(this, partial);
  }
}

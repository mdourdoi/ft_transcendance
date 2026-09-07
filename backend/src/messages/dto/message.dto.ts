import { Expose, Type } from "class-transformer";
import { TinyUserDto } from "src/users/dto/tiny-user.dto";

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

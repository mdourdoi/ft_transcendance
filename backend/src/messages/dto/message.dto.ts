import { Expose } from "class-transformer";

export class MessageDto {
  @Expose() public id: string;
  @Expose() public content: string;
  @Expose() public sender: string;
}
import { Expose } from "class-transformer";

export class ConversationDto {
  @Expose() public items: []
}
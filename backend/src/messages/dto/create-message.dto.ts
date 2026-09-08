import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMessageDto {
  @IsNumber({ allowNaN: false })
  @IsPositive()
  public conversationId: number;

  @IsNumber({ allowNaN: false })
  @IsPositive()
  public senderId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  public content: string;
}

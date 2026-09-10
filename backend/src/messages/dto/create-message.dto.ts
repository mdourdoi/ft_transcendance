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

  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  public content: string;
}

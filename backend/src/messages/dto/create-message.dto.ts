import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  public content: string;
}

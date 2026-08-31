import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;
  @IsString()
  username: string;
  @IsString()
  @MinLength(8)
  password: string;
}
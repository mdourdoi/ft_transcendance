import { IsEmail, IsString, IsStrongPassword, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email: string;
  @IsString()
  username: string;
  @IsString()
  @MinLength(8)
  @IsStrongPassword({ minLength: 8, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 })
  password: string;
}

import { IsEmail, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @IsString()
  email?: string;
  @IsOptional()
  @IsString()
  username?: string;
}

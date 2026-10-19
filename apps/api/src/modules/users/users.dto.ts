import { IsString, IsOptional, IsEmail, MinLength, MaxLength, IsNumber } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class UpdateAddressDto {
  @IsString()
  addressLine!: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

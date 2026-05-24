import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'User email address', example: 'buyer@kstatra.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'User password', example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ description: 'User display name', example: 'Hong Gil-dong' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'User role', enum: ['buyer', 'company'], default: 'buyer' })
  @IsEnum(['buyer', 'company'])
  @IsNotEmpty()
  role: 'buyer' | 'company';

  // Optional business fields for automatic profile creation
  @ApiProperty({ description: 'Country (optional)', example: 'South Korea', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Industry sectors (optional)', example: ['K-Beauty', 'Robotics'], required: false })
  @IsOptional()
  industries?: string[];
}

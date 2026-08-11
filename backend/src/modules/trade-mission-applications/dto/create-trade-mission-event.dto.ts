import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTradeMissionEventDto {
  @ApiProperty({ description: 'Event URL Slug', example: 'demo-mexico-auto-2026' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Event Name (Korean)', example: '[DEMO] 2026 멕시코 자동차부품 시장개척단' })
  @IsString()
  @IsNotEmpty()
  nameKo: string;

  @ApiPropertyOptional({ description: 'Event Name (English)' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Event Description (Korean)' })
  @IsString()
  @IsOptional()
  descriptionKo?: string;

  @ApiPropertyOptional({ description: 'Event Description (English)' })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ description: 'Target Country', example: '멕시코' })
  @IsString()
  @IsNotEmpty()
  targetCountry: string;

  @ApiPropertyOptional({ description: 'Target Region' })
  @IsString()
  @IsOptional()
  targetRegion?: string;

  @ApiPropertyOptional({ description: 'Target City', example: '멕시코시티, 몬테레이' })
  @IsString()
  @IsOptional()
  targetCity?: string;

  @ApiPropertyOptional({ description: 'Start Date' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Application Open Date' })
  @IsString()
  @IsOptional()
  applicationOpenAt?: string;

  @ApiProperty({ description: 'Application Deadline', example: '2026-09-30' })
  @IsString()
  @IsNotEmpty()
  applicationDeadline: string;

  @ApiPropertyOptional({ description: 'Target Industries', example: ['자동차부품', '모빌리티'] })
  @IsArray()
  @IsOptional()
  targetIndustries?: string[];

  @ApiPropertyOptional({ description: 'Capacity', example: 20 })
  @IsNumber()
  @IsOptional()
  capacity?: number;

  @ApiPropertyOptional({ description: 'Contact Name' })
  @IsString()
  @IsOptional()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact Email' })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Status: draft | open | closed | archived', default: 'open' })
  @IsString()
  @IsOptional()
  status?: string;
}

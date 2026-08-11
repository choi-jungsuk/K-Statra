import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryTradeMissionApplicationsDto {
  @ApiPropertyOptional({ description: 'Event Slug Filter' })
  @IsString()
  @IsOptional()
  eventSlug?: string;

  @ApiPropertyOptional({ description: 'Event ID Filter' })
  @IsString()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional({ description: 'Application Status Filter' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Industry Filter' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiPropertyOptional({ description: 'Search Query (Company or Contact)' })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ description: 'Limit', default: 50 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Page', default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

function trimDedupe(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set((value as string[]).map((s) => String(s).trim()).filter(Boolean)),
  );
}

export class CreateCompanyDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Automotive' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;

  @ApiPropertyOptional({ type: [String], example: ['EV parts', 'PCB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  offerings?: string[];

  @ApiPropertyOptional({ type: [String], example: ['OEM', 'overseas partner'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  needs?: string[];

  @ApiPropertyOptional({ type: [String], example: ['B2B', 'export'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  tags?: string[];

  @ApiPropertyOptional({ example: '한국 자동차 부품 제조사입니다.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  profileText?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xxx' })
  @IsOptional()
  @ValidateIf((o) => o.videoUrl !== '' && o.videoUrl != null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  videoUrl?: string;

  @ApiPropertyOptional({ example: '주식회사 에이비씨모빌리티' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyNameKo?: string;

  @ApiPropertyOptional({ example: 'ABC Mobility Co., Ltd.' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyNameEn?: string;

  @ApiPropertyOptional({ example: 'South Korea' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @ApiPropertyOptional({ example: 'EV Battery Thermal Management Components' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  subIndustry?: string;

  @ApiPropertyOptional({ example: 'A-123' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  boothNumber?: string;

  @ApiPropertyOptional({ example: 'KOAA SHOW' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  exhibitionName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/brochure.pdf' })
  @IsOptional()
  @ValidateIf((o) => o.brochureUrl !== '' && o.brochureUrl != null)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(500)
  brochureUrl?: string;

  @ApiPropertyOptional({ example: 'Automotive parts' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  exhibitorCategory?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['EV battery cooling plates'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  mainProducts?: string[];

  @ApiPropertyOptional({ type: [String], example: ['battery cooling plate'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  productKeywords?: string[];

  @ApiPropertyOptional({ type: [String], example: ['CNC machining'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  technologyKeywords?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Tier-1 Automotive Supplier'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  targetBuyerTypes?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['United States', 'Germany'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  targetMarkets?: string[];

  @ApiPropertyOptional({ type: [String], example: ['IATF 16949', 'ISO 9001'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  certifications?: string[];

  @ApiPropertyOptional({ enum: ['unknown', 'low', 'medium', 'high'] })
  @IsOptional()
  @IsIn(['unknown', 'low', 'medium', 'high'])
  exportReadiness?: string;

  @ApiPropertyOptional({ example: 'AI-generated export readiness summary.' })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  companySummary?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['automotive thermal management'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  buyerMatchingKeywords?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['"battery cooling plate" buyer procurement'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  recommendedSearchQueries?: string[];

  @ApiPropertyOptional({ enum: ['A', 'B', 'C', 'D'] })
  @IsOptional()
  @IsIn(['A', 'B', 'C', 'D'])
  dataConfidence?: string;

  @ApiPropertyOptional({ type: [String], example: ['certifications'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  missingFields?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['English brochure not verified'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => trimDedupe(value))
  riskNotes?: string[];

  @ApiPropertyOptional({
    example: 'Best fit: EV OEM and battery pack suppliers.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  matchSummary?: string;

  @ApiPropertyOptional({
    enum: ['not_started', 'draft', 'generated', 'reviewed'],
  })
  @IsOptional()
  @IsIn(['not_started', 'draft', 'generated', 'reviewed'])
  axProfileStatus?: string;
}

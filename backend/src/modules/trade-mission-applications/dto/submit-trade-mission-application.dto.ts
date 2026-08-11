import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Equals, IsArray, IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitTradeMissionApplicationDto {
  @ApiProperty({ description: 'Company Name (Korean)', example: '[DEMO] 테크플로우 솔루션스' })
  @IsString()
  @IsNotEmpty()
  companyNameKo: string;

  @ApiPropertyOptional({ description: 'Company Name (English)' })
  @IsString()
  @IsOptional()
  companyNameEn?: string;

  @ApiPropertyOptional({ description: 'Business Registration Number' })
  @IsString()
  @IsOptional()
  businessRegistrationNo?: string;

  @ApiPropertyOptional({ description: 'Website URL' })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Location Address', example: '경기도 성남시 분당구' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: 'Industry Sector', example: '자동차 전장부품' })
  @IsString()
  @IsNotEmpty()
  industry: string;

  @ApiProperty({ description: 'Main Products', example: '차량용 센서 모듈' })
  @IsString()
  @IsNotEmpty()
  products: string;

  @ApiProperty({ description: 'Contact Name', example: '배성민' })
  @IsString()
  @IsNotEmpty()
  contactName: string;

  @ApiPropertyOptional({ description: 'Contact Department' })
  @IsString()
  @IsOptional()
  contactDepartment?: string;

  @ApiProperty({ description: 'Contact Email', example: 'demo-applicant@ainglobalax.com' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiProperty({ description: 'Contact Phone', example: '010-1234-5678' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiProperty({ description: 'Participation Target Products', example: '차량용 스마트 카메라 센서' })
  @IsString()
  @IsNotEmpty()
  participationProducts: string;

  @ApiPropertyOptional({ description: 'Export Experience Level: none | preparing | experienced', default: 'none' })
  @IsString()
  @IsOptional()
  exportExperienceLevel?: string;

  @ApiPropertyOptional({ description: 'Existing Export Countries' })
  @IsArray()
  @IsOptional()
  existingExportCountries?: string[];

  @ApiPropertyOptional({ description: 'Certifications' })
  @IsArray()
  @IsOptional()
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Desired Buyer Types' })
  @IsArray()
  @IsOptional()
  desiredBuyerTypes?: string[];

  @ApiPropertyOptional({ description: 'Participation Purpose' })
  @IsString()
  @IsOptional()
  participationPurpose?: string;

  @ApiProperty({ description: 'Privacy Consent (Must be true)', example: true })
  @IsBoolean()
  @Equals(true, { message: '개인정보 수집 및 이용 동의는 필수입니다.' })
  privacyConsent: boolean;

  @ApiPropertyOptional({ description: 'Marketing Consent', default: false })
  @IsBoolean()
  @IsOptional()
  marketingConsent?: boolean;
}

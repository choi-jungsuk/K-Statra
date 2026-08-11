import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTradeMissionApplicationDto {
  @ApiPropertyOptional({
    description:
      'Status: submitted | reviewing | needs_information | approved | waitlisted | rejected | withdrawn',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Admin Note / Review Comments' })
  @IsString()
  @IsOptional()
  adminNote?: string;
}

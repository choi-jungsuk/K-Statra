import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: '기업 목록 (검색/페이지네이션/정렬)' })
  @ApiResponse({
    status: 200,
    description: '기업 목록',
    schema: {
      example: { page: 1, limit: 10, total: 100, totalPages: 10, data: [] },
    },
  })
  findAll(@Query() query: QueryCompanyDto) {
    return this.companiesService.findAll(query);
  }

  @Get('cluster-stats/summary')
  @ApiOperation({ summary: 'MongoDB 실시간 클러스터 국내업체 & 바이어 현황 통계' })
  @ApiResponse({ status: 200, description: '클러스터 현황 통계' })
  getClusterStats() {
    return this.companiesService.getClusterStats();
  }

  @Get('cluster-stats/export-domestic-xlsx')
  @ApiOperation({ summary: '고유 국내업체 분류별 엑셀 다운로드' })
  @ApiResponse({ status: 200, description: '엑셀 파일 스트림' })
  async exportDomesticXlsx(
    @Query('category') category = 'all',
    @Res() res: Response,
  ) {
    const { buffer, fileName } =
      await this.companiesService.exportDomesticCompaniesExcel(category);
    return this.sendExcel(res, buffer, fileName, 'domestic_companies.xlsx');
  }

  @Get('cluster-stats/export-buyers-xlsx')
  @ApiOperation({ summary: '잠재·확정 바이어 분류별 엑셀 다운로드' })
  @ApiResponse({ status: 200, description: '엑셀 파일 스트림' })
  async exportBuyersXlsx(
    @Query('status') status = 'potential',
    @Res() res: Response,
  ) {
    const { buffer, fileName } =
      await this.companiesService.exportBuyersExcel(status);
    return this.sendExcel(res, buffer, fileName, 'buyers.xlsx');
  }

  @Get('cluster-stats/export-no-email-xlsx')
  @ApiOperation({ summary: '이메일 미보유 국내업체 목록 엑셀 다운로드' })
  @ApiResponse({ status: 200, description: '엑셀 파일 스트림' })
  async exportNoEmailXlsx(@Res() res: Response) {
    const { buffer, fileName } =
      await this.companiesService.exportDomesticNoEmailExcel();
    return this.sendExcel(res, buffer, fileName, 'domestic_no_email.xlsx');
  }

  private sendExcel(
    res: Response,
    buffer: Buffer,
    fileName: string,
    fallbackName: string,
  ) {
    const encoded = encodeURIComponent(fileName).replace(/'/g, '%27');
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fallbackName}"; filename*=UTF-8''${encoded}`,
    );
    res.setHeader('Content-Length', String(buffer.length));
    return res.end(buffer);
  }

  @Get(':id/ax-profile')
  @ApiOperation({ summary: '기업 AX 프로필 단건 조회 (PDF 출력용)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'AX 프로필 데이터' })
  @ApiResponse({ status: 404, description: '기업 없음' })
  getAxProfile(@Param('id', ParseMongoIdPipe) id: string) {
    return this.companiesService.getAxProfile(id);
  }

  @Get(':id/ax-profile/pdf')
  @ApiOperation({ summary: '기업 AX 프로필 PDF 다운로드' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'PDF 파일 스트림' })
  @ApiResponse({ status: 404, description: '기업 없음 또는 PDF 미보유' })
  async getAxProfilePdf(
    @Param('id', ParseMongoIdPipe) id: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } = await this.companiesService.getAxProfilePdf(id);
    // 한글 파일명이 깨지지 않도록 RFC 5987 인코딩 사용
    const encoded = encodeURIComponent(fileName).replace(/'/g, '%27');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ax_profile.pdf"; filename*=UTF-8''${encoded}`,
    );
    return res.sendFile(filePath);
  }

  @Get(':id')
  @ApiOperation({ summary: '기업 단건 조회' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: '기업 정보' })
  @ApiResponse({ status: 400, description: '유효하지 않은 ID' })
  @ApiResponse({ status: 404, description: '기업 없음' })
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.companiesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '기업 생성 (이미지 없으면 플레이스홀더 자동 삽입)' })
  @ApiResponse({ status: 201, description: '생성된 기업' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '기업 수정 (부분 업데이트)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: '수정된 기업' })
  @ApiResponse({ status: 400, description: '유효하지 않은 ID 또는 빈 본문' })
  @ApiResponse({ status: 404, description: '기업 없음' })
  update(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: '기업 삭제' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 ID' })
  @ApiResponse({ status: 404, description: '기업 없음' })
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.companiesService.remove(id);
  }
}

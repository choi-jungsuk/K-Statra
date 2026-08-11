import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as XLSX from 'xlsx';
import { TradeMissionApplicationsService } from './trade-mission-applications.service';
import { CreateTradeMissionEventDto } from './dto/create-trade-mission-event.dto';
import { SubmitTradeMissionApplicationDto } from './dto/submit-trade-mission-application.dto';
import { QueryTradeMissionApplicationsDto } from './dto/query-trade-mission-applications.dto';
import { UpdateTradeMissionApplicationDto } from './dto/update-trade-mission-application.dto';

@ApiTags('Trade Mission Applications')
@Controller()
export class TradeMissionApplicationsController {
  constructor(
    private readonly tradeMissionService: TradeMissionApplicationsService,
  ) {}

  // ──────────────────────────────────────────────
  // Public Endpoints (No Auth Required)
  // ──────────────────────────────────────────────

  @Get('public/trade-mission-events/:slug')
  @ApiOperation({ summary: '공개 시장개척단 행사 정보 조회' })
  async getPublicEvent(@Param('slug') slug: string) {
    return this.tradeMissionService.getPublicEventBySlug(slug);
  }

  @Post('public/trade-mission-events/:slug/applications')
  @ApiOperation({ summary: '온라인 참가신청서 제출' })
  async submitApplication(
    @Param('slug') slug: string,
    @Body() dto: SubmitTradeMissionApplicationDto,
  ) {
    return this.tradeMissionService.submitApplication(slug, dto);
  }

  // ──────────────────────────────────────────────
  // Admin Endpoints
  // ──────────────────────────────────────────────

  @Post('admin/trade-mission-events')
  @ApiOperation({ summary: '관리자 시장개척단 신규 행사 생성' })
  async createEvent(@Body() dto: CreateTradeMissionEventDto) {
    return this.tradeMissionService.createEvent(dto);
  }

  @Get('admin/trade-mission-events')
  @ApiOperation({ summary: '관리자 시장개척단 행사 목록 조회' })
  async getEvents() {
    return this.tradeMissionService.getEvents();
  }

  @Patch('admin/trade-mission-events/:id')
  @ApiOperation({ summary: '관리자 시장개척단 행사 정보/상태 수정' })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTradeMissionEventDto>,
  ) {
    return this.tradeMissionService.updateEvent(id, dto);
  }

  @Get('admin/trade-mission-applications')
  @ApiOperation({ summary: '관리자 시장개척단 참가신청서 목록 검색/필터' })
  async getApplications(@Query() query: QueryTradeMissionApplicationsDto) {
    return this.tradeMissionService.getApplications(query);
  }

  @Get('admin/trade-mission-applications/export')
  @ApiOperation({ summary: '관리자 시장개척단 참가신청서 목록 Excel 내보내기' })
  async exportApplications(
    @Query() query: QueryTradeMissionApplicationsDto,
    @Res() res: Response,
  ) {
    const data = await this.tradeMissionService.exportApplications(query);

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '시장개척단 접수목록');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = `Trade_Mission_Applications_${new Date().toISOString().substring(0, 10)}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    res.send(buffer);
  }

  @Get('admin/trade-mission-applications/:id')
  @ApiOperation({ summary: '관리자 시장개척단 참가신청서 상세 조회' })
  async getApplicationById(@Param('id') id: string) {
    return this.tradeMissionService.getApplicationById(id);
  }

  @Patch('admin/trade-mission-applications/:id')
  @ApiOperation({ summary: '관리자 시장개척단 참가신청서 상태/메모 수정' })
  async updateApplication(
    @Param('id') id: string,
    @Body() dto: UpdateTradeMissionApplicationDto,
  ) {
    return this.tradeMissionService.updateApplication(id, dto, 'admin');
  }
}

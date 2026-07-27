import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import type { Response } from 'express';
import { ApplicationsService } from './applications.service';
import { AdminTokenGuard } from '../admin/guards/admin-token.guard';

// ─── 공개 API: 신청서 제출 ─────────────────────────────────
@ApiTags('Applications - Public')
@Controller('apply')
export class ApplicationPublicController {
  constructor(private readonly service: ApplicationsService) {}

  @Post(':eventId')
  @ApiOperation({ summary: '참가 신청서 제출 (공개)' })
  async submit(
    @Param('eventId') eventId: string,
    @Body() body: any,
  ) {
    if (!body.company_name || !body.contact_person || !body.contact_email || !body.contact_phone) {
      throw new BadRequestException('필수 항목(업체명, 담당자, 이메일, 전화번호)을 입력해 주세요.');
    }
    const app = await this.service.create({
      event_id: eventId,
      event_name: body.event_name || eventId,
      event_type: body.event_type || 'booth',
      company_name: body.company_name,
      contact_person: body.contact_person,
      contact_email: body.contact_email,
      contact_phone: body.contact_phone,
      business_reg_no: body.business_reg_no,
      website: body.website,
      industry: body.industry,
      products: body.products,
      booth_size: body.booth_size,
      target_country: body.target_country,
      reason: body.reason,
      memo: body.memo,
      status: 'pending',
    });
    return {
      ok: true,
      id: app._id,
      message: `✅ 신청서가 접수되었습니다. 담당자 확인 후 연락드리겠습니다.`,
    };
  }
}

// ─── 어드민 API: 신청서 관리 ───────────────────────────────
@ApiTags('Applications - Admin')
@ApiHeader({ name: 'x-admin-token', required: true })
@UseGuards(AdminTokenGuard)
@Controller('admin/applications')
export class ApplicationAdminController {
  constructor(private readonly service: ApplicationsService) {}

  @Get()
  @ApiOperation({ summary: '신청서 목록 조회' })
  async findAll(
    @Query('event_id') event_id?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      event_id,
      status,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('events')
  @ApiOperation({ summary: '이벤트 목록 (접수된 신청서 기반)' })
  async getEvents() {
    return this.service.getEventList();
  }

  @Get('export')
  @ApiOperation({ summary: '신청서 엑셀 다운로드' })
  async exportExcel(
    @Query('event_id') event_id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportExcel(event_id);
    const filename = `applications_${event_id || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '신청서 상태 변경 (승인/반려/검토중)' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'pending' | 'approved' | 'rejected',
    @Body('admin_note') adminNote?: string,
  ) {
    return this.service.updateStatus(id, status, adminNote);
  }
}

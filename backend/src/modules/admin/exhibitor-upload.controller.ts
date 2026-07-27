import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiHeader } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { ExhibitorUploadService } from './exhibitor-upload.service';

@ApiTags('Admin - Exhibitor Upload')
@ApiHeader({
  name: 'x-admin-token',
  required: true,
  description: '관리자 인증 토큰',
})
@UseGuards(AdminTokenGuard)
@Controller('admin/exhibitor')
export class ExhibitorUploadController {
  constructor(private readonly uploadService: ExhibitorUploadService) {}

  /**
   * 파일 파싱 + 중복 감지 프리뷰 (DB 저장 전)
   */
  @Post('preview')
  @ApiOperation({ summary: '엑셀/CSV 파싱 & 중복 감지 프리뷰 (저장 안 함)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async preview(
    @UploadedFile() file: Express.Multer.File,
    @Body('source_group') sourceGroup: string,
  ) {
    if (!file) throw new BadRequestException('파일을 업로드해 주세요.');
    if (!sourceGroup) throw new BadRequestException('소스 그룹명을 입력해 주세요.');

    const records = this.uploadService.parseFile(file.buffer, file.originalname);
    if (!records.length) throw new BadRequestException('파싱된 데이터가 없습니다. 파일 형식을 확인해 주세요.');

    const preview = await this.uploadService.previewUpload(records, sourceGroup);
    return {
      ok: true,
      filename: file.originalname,
      source_group: sourceGroup,
      ...preview,
    };
  }

  /**
   * DB에 실제 저장
   */
  @Post('upload')
  @ApiOperation({ summary: '정제 완료 엑셀 → MongoDB 저장' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('source_group') sourceGroup: string,
    @Body('uploaded_by') uploadedBy: string,
  ) {
    if (!file) throw new BadRequestException('파일을 업로드해 주세요.');
    if (!sourceGroup) throw new BadRequestException('소스 그룹명을 입력해 주세요.');

    const records = this.uploadService.parseFile(file.buffer, file.originalname);
    if (!records.length) throw new BadRequestException('파싱된 데이터가 없습니다.');

    const result = await this.uploadService.uploadToDb(
      records,
      sourceGroup,
      file.originalname,
      uploadedBy || 'admin',
    );

    return {
      ok: true,
      filename: file.originalname,
      source_group: sourceGroup,
      ...result,
      message: `✅ ${result.inserted}건 저장 완료 (중복 ${result.skipped}건 건너뜀)`,
    };
  }

  /**
   * 업로드 이력 조회
   */
  @Get('upload-history')
  @ApiOperation({ summary: '업로드 이력 조회 (최근 50건)' })
  async getHistory() {
    const history = await this.uploadService.getUploadHistory();
    return { ok: true, data: history };
  }
}

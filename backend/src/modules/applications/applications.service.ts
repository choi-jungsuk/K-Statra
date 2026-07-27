import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument, ApplicationStatus } from './application.schema';
import * as XLSX from 'xlsx';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  /** 신청서 제출 (공개 API) */
  async create(data: Partial<Application>): Promise<ApplicationDocument> {
    const app = new this.applicationModel(data);
    const saved = await app.save();
    this.logger.log(`새 신청서 접수: ${saved.company_name} (${saved.event_id})`);
    return saved;
  }

  /** 모든 신청서 조회 (어드민) */
  async findAll(options: {
    event_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ApplicationDocument[]; total: number; stats: Record<string, number> }> {
    const { event_id, status, page = 1, limit = 50 } = options;
    const filter: Record<string, any> = {};
    if (event_id) filter.event_id = event_id;
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.applicationModel.countDocuments(filter),
    ]);

    // 상태별 통계
    const allForStats = await this.applicationModel.find({ event_id: event_id || { $exists: true } }).lean();
    const stats = allForStats.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { data: data as ApplicationDocument[], total, stats };
  }

  /** 이벤트 ID 목록 조회 */
  async getEventList(): Promise<{ event_id: string; event_name: string; count: number }[]> {
    const agg = await this.applicationModel.aggregate([
      {
        $group: {
          _id: '$event_id',
          event_name: { $first: '$event_name' },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    return agg.map(a => ({ event_id: a._id, event_name: a.event_name, count: a.count }));
  }

  /** 상태 업데이트 (어드민) */
  async updateStatus(
    id: string,
    status: ApplicationStatus,
    adminNote?: string,
  ): Promise<ApplicationDocument> {
    const app = await this.applicationModel.findByIdAndUpdate(
      id,
      { status, admin_note: adminNote || '', reviewed_at: new Date() },
      { new: true },
    );
    if (!app) throw new NotFoundException('신청서를 찾을 수 없습니다.');
    return app;
  }

  /** 엑셀 내보내기 */
  async exportExcel(event_id?: string): Promise<Buffer> {
    const filter = event_id ? { event_id } : {};
    const data = await this.applicationModel.find(filter).sort({ createdAt: -1 }).lean();

    const rows = data.map((a, i) => ({
      '#': i + 1,
      '이벤트': a.event_name,
      '구분': a.event_type === 'booth' ? '부스' : '시장개척단',
      '업체명': a.company_name,
      '담당자': a.contact_person,
      '이메일': a.contact_email,
      '전화번호': a.contact_phone,
      '사업자번호': a.business_reg_no || '',
      '업종/품목': a.industry,
      '주요제품': a.products || '',
      '부스 크기': a.booth_size || '',
      '목표국가': a.target_country || '',
      '홈페이지': a.website || '',
      '신청 사유': a.reason || '',
      '상태': a.status === 'pending' ? '검토중' : a.status === 'approved' ? '승인' : '반려',
      '관리자 메모': a.admin_note || '',
      '접수 일시': (a as any).createdAt ? new Date((a as any).createdAt).toLocaleString('ko-KR') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '신청서 목록');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}

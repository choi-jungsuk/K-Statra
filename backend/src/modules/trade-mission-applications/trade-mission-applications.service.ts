import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TradeMissionEvent,
  TradeMissionEventDocument,
} from './schemas/trade-mission-event.schema';
import {
  TradeMissionApplication,
  TradeMissionApplicationDocument,
} from './schemas/trade-mission-application.schema';
import { CreateTradeMissionEventDto } from './dto/create-trade-mission-event.dto';
import { SubmitTradeMissionApplicationDto } from './dto/submit-trade-mission-application.dto';
import { QueryTradeMissionApplicationsDto } from './dto/query-trade-mission-applications.dto';
import { UpdateTradeMissionApplicationDto } from './dto/update-trade-mission-application.dto';

@Injectable()
export class TradeMissionApplicationsService {
  constructor(
    @InjectModel(TradeMissionEvent.name)
    private readonly eventModel: Model<TradeMissionEventDocument>,
    @InjectModel(TradeMissionApplication.name)
    private readonly applicationModel: Model<TradeMissionApplicationDocument>,
  ) {}

  // ──────────────────────────────────────────────
  // Public Event & Application methods
  // ──────────────────────────────────────────────

  async getPublicEventBySlug(slug: string) {
    const event = await this.eventModel.findOne({ slug }).exec();
    if (!event) {
      throw new NotFoundException(`존재하지 않는 행사입니다: ${slug}`);
    }

    const now = new Date();
    const isClosed =
      event.status !== 'open' ||
      (event.applicationDeadline &&
        new Date(event.applicationDeadline + 'T23:59:59') < now);

    return {
      slug: event.slug,
      nameKo: event.nameKo,
      nameEn: event.nameEn || '',
      type: event.type,
      descriptionKo: event.descriptionKo || '',
      descriptionEn: event.descriptionEn || '',
      targetCountry: event.targetCountry,
      targetRegion: event.targetRegion || '',
      targetCity: event.targetCity || '',
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      applicationDeadline: event.applicationDeadline,
      targetIndustries: event.targetIndustries || [],
      capacity: event.capacity || 30,
      contactName: event.contactName || '',
      contactEmail: event.contactEmail || '',
      status: isClosed ? 'closed' : event.status,
      isClosed,
      privacyNoticeVersion: event.privacyNoticeVersion || 'v1.0',
    };
  }

  async submitApplication(slug: string, dto: SubmitTradeMissionApplicationDto) {
    const event = await this.eventModel.findOne({ slug }).exec();
    if (!event) {
      throw new NotFoundException(`존재하지 않는 행사입니다: ${slug}`);
    }

    if (event.status !== 'open') {
      throw new BadRequestException('현재 접수 중인 행사가 아닙니다.');
    }

    const now = new Date();
    if (
      event.applicationDeadline &&
      new Date(event.applicationDeadline + 'T23:59:59') < now
    ) {
      throw new BadRequestException('신청 마감일이 지났습니다.');
    }

    const normalizedEmail = dto.contactEmail.trim().toLowerCase();

    // 중복 신청 검증 (동일 행사 + 동일 이메일)
    const existing = await this.applicationModel
      .findOne({
        eventId: event._id,
        contactEmail: normalizedEmail,
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        '동일 행사에 이미 접수된 신청정보가 존재합니다. 담당자에게 문의해 주세요.',
      );
    }

    // 예측하기 어려운 고유 접수번호 생성
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const applicationNumber = `TM2026-${randomHex}`;

    const newApp = await this.applicationModel.create({
      applicationNumber,
      eventId: event._id,
      eventSlug: event.slug,
      companyNameKo: dto.companyNameKo.trim(),
      companyNameEn: dto.companyNameEn?.trim() || '',
      businessRegistrationNo: dto.businessRegistrationNo?.trim() || '',
      website: dto.website?.trim() || '',
      location: dto.location.trim(),
      industry: dto.industry.trim(),
      products: dto.products.trim(),
      contactName: dto.contactName.trim(),
      contactDepartment: dto.contactDepartment?.trim() || '',
      contactEmail: normalizedEmail,
      contactPhone: dto.contactPhone.trim(),
      targetCountry: event.targetCountry,
      participationProducts: dto.participationProducts.trim(),
      exportExperienceLevel: dto.exportExperienceLevel || 'none',
      existingExportCountries: dto.existingExportCountries || [],
      certifications: dto.certifications || [],
      desiredBuyerTypes: dto.desiredBuyerTypes || [],
      participationPurpose: dto.participationPurpose?.trim() || '',
      privacyConsent: dto.privacyConsent,
      privacyNoticeVersion: event.privacyNoticeVersion || 'v1.0',
      consentedAt: new Date(),
      marketingConsent: dto.marketingConsent || false,
      status: 'submitted',
      adminNote: '',
    });

    return {
      success: true,
      applicationNumber: newApp.applicationNumber,
      companyNameKo: newApp.companyNameKo,
      eventSlug: event.slug,
      eventNameKo: event.nameKo,
      targetCountry: event.targetCountry,
      submittedAt: newApp.createdAt,
    };
  }

  // ──────────────────────────────────────────────
  // Admin Methods (Events & Applications)
  // ──────────────────────────────────────────────

  async createEvent(dto: CreateTradeMissionEventDto) {
    const existing = await this.eventModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new BadRequestException(`이미 존재하는 slug입니다: ${dto.slug}`);
    }

    return this.eventModel.create({
      ...dto,
      slug: dto.slug.trim(),
      nameKo: dto.nameKo.trim(),
      status: dto.status || 'open',
    });
  }

  async getEvents() {
    return this.eventModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateEvent(id: string, dto: Partial<CreateTradeMissionEventDto>) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('올바르지 않은 행사 ID입니다.');
    }

    const updated = await this.eventModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('행사를 찾을 수 없습니다.');
    }
    return updated;
  }

  async getApplications(query: QueryTradeMissionApplicationsDto) {
    const filter: Record<string, any> = {};

    if (query.eventSlug) filter.eventSlug = query.eventSlug;
    if (query.eventId && Types.ObjectId.isValid(query.eventId)) {
      filter.eventId = new Types.ObjectId(query.eventId);
    }
    if (query.status) filter.status = query.status;
    if (query.industry) {
      filter.industry = { $regex: query.industry, $options: 'i' };
    }

    if (query.q) {
      const searchRegex = { $regex: query.q, $options: 'i' };
      filter.$or = [
        { companyNameKo: searchRegex },
        { companyNameEn: searchRegex },
        { contactName: searchRegex },
        { contactEmail: searchRegex },
        { applicationNumber: searchRegex },
      ];
    }

    const limit = query.limit || 50;
    const page = query.page || 1;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.applicationModel.countDocuments(filter).exec(),
    ]);

    // 전체 상태별 통계 계산
    const baseFilter = query.eventSlug ? { eventSlug: query.eventSlug } : {};
    const statsArray = await this.applicationModel.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats: Record<string, number> = {
      total: 0,
      submitted: 0,
      reviewing: 0,
      needs_information: 0,
      approved: 0,
      waitlisted: 0,
      rejected: 0,
      withdrawn: 0,
    };

    statsArray.forEach((item) => {
      if (item._id in stats) {
        stats[item._id] = item.count;
      }
      stats.total += item.count;
    });

    return {
      items,
      total,
      page,
      limit,
      stats,
    };
  }

  async getApplicationById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('올바르지 않은 신청서 ID입니다.');
    }

    const application = await this.applicationModel.findById(id).exec();
    if (!application) {
      throw new NotFoundException('신청서를 찾을 수 없습니다.');
    }
    return application;
  }

  async updateApplication(
    id: string,
    dto: UpdateTradeMissionApplicationDto,
    reviewer: string = 'admin',
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('올바르지 않은 신청서 ID입니다.');
    }

    const updateData: Record<string, any> = {};
    if (dto.status) updateData.status = dto.status;
    if (dto.adminNote !== undefined) updateData.adminNote = dto.adminNote;
    updateData.reviewedBy = reviewer;
    updateData.reviewedAt = new Date();

    const updated = await this.applicationModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('신청서를 찾을 수 없습니다.');
    }
    return updated;
  }

  async exportApplications(query: QueryTradeMissionApplicationsDto) {
    const res = await this.getApplications({ ...query, limit: 1000, page: 1 });
    return res.items.map((app) => ({
      접수번호: app.applicationNumber,
      행사슬러그: app.eventSlug,
      상태: app.status,
      기업명_국문: app.companyNameKo,
      기업명_영문: app.companyNameEn || '',
      사업자등록번호: app.businessRegistrationNo || '',
      소재지: app.location,
      산업: app.industry,
      주요제품: app.products,
      담당자명: app.contactName,
      부서_직급: app.contactDepartment || '',
      이메일: app.contactEmail,
      전화번호: app.contactPhone,
      목표국가: app.targetCountry || '',
      참가희망품목: app.participationProducts,
      수출경험_자기기재: app.exportExperienceLevel,
      기존수출국가: (app.existingExportCountries || []).join(', '),
      보유인증: (app.certifications || []).join(', '),
      희망바이어유형: (app.desiredBuyerTypes || []).join(', '),
      참가목적: app.participationPurpose || '',
      개인정보동의: app.privacyConsent ? '동의' : '미동의',
      동의일시: app.consentedAt ? new Date(app.consentedAt).toLocaleString() : '',
      접수일시: app.createdAt ? new Date(app.createdAt).toLocaleString() : '',
      관리자메모: app.adminNote || '',
    }));
  }
}

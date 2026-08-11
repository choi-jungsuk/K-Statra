import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Company, CompanyDocument } from './schemas/company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as XLSX from 'xlsx';
import { QueryCompanyDto } from './dto/query-company.dto';

const DEFAULT_IMAGE_URL =
  process.env.DEFAULT_COMPANY_IMAGE_URL ||
  'https://placehold.co/320x160?text=AINGLOBAL%20AX';

// AX 프로필 PDF 원본 저장 폴더 (mongodb_koaashow_cluster 보관소)
const AX_PROFILE_PDF_DIR =
  process.env.AX_PROFILE_PDF_DIR ||
  path.join(
    'D:',
    'ainglobal-manage-project',
    'mongodb_koaashow_cluster',
    'AX_Profiles_1000_국내업체_Master',
    'pdf_profiles',
  );

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  private static readonly LIST_PROJECTION = {
    name: 1,
    industry: 1,
    tags: 1,
    location: 1,
    sizeBucket: 1,
    profileText: 1,
    dataSource: 1,
    matchRecommendation: 1,
    updatedAt: 1,
    'dart.corpCode': 1,
    'primaryContact.name': 1,
    'primaryContact.email': 1,
    'images.url': 1,
    'images.caption': 1,
    'images.alt': 1,
  };

  async findAll(query: QueryCompanyDto) {
    const {
      q,
      industry,
      tag,
      country,
      size,
      partnership,
      page = 1,
      limit = 10,
      sortBy = 'updatedAt',
      order = 'desc',
    } = query;

    const filter: Record<string, any> = {};
    if (q) filter.$text = { $search: q };
    if (industry) filter.industry = industry;
    if (tag) filter.tags = tag;
    if (country) filter['location.country'] = country;
    if (size) filter.sizeBucket = size;
    if (partnership) filter.tags = partnership;

    const hasFilter = Object.keys(filter).length > 0;
    const sortField = sortBy === 'nameNumeric' ? 'name' : sortBy;
    const sort = { [sortField]: order === 'asc' ? 1 : -1 } as Record<
      string,
      1 | -1
    >;
    const skip = (page - 1) * limit;

    let findQuery = this.companyModel
      .find(filter, CompaniesService.LIST_PROJECTION)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    if (sortBy === 'nameNumeric') {
      findQuery = findQuery.collation({ locale: 'en', numericOrdering: true });
    }

    const countQuery = hasFilter
      ? this.companyModel.countDocuments(filter)
      : this.companyModel.estimatedDocumentCount();

    const [raw, total] = await Promise.all([findQuery.exec(), countQuery]);

    const items = raw.map(({ dart, ...rest }) => ({
      ...rest,
      dartVerified: !!(dart as any)?.corpCode,
    }));

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    };
  }

  async findById(id: string): Promise<CompanyDocument> {
    const doc = await this.companyModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Company not found');
    return doc;
  }

  async getAxProfile(id: string) {
    const company = await this.companyModel.findById(id).lean().exec();
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const c = company as any;
    const status = c.axProfileStatus || 'not_started';
    const hasStatus = status === 'generated' || status === 'reviewed';
    const hasContent = !!(
      c.companySummary ||
      c.profileText ||
      (Array.isArray(c.mainProducts) && c.mainProducts.length > 0)
    );

    const available = hasStatus && hasContent;
    const pdfFile = this.resolveAxProfilePdfPath(c.axProfilePdf?.fileName);

    if (!available) {
      return {
        available: false,
        status,
        hasPdf: !!pdfFile,
        profile: null,
      };
    }

    return {
      available: true,
      status,
      hasPdf: !!pdfFile,
      profile: {
        companyNameKo: c.companyNameKo || c.name || c.company_name || '',
        companyNameEn: c.companyNameEn || '',
        industry: c.industry || '',
        subIndustry: c.subIndustry || '',
        companySummary: c.companySummary || c.profileText || '',
        mainProducts: Array.isArray(c.mainProducts) ? c.mainProducts : [],
        productKeywords: Array.isArray(c.productKeywords) ? c.productKeywords : [],
        technologyKeywords: Array.isArray(c.technologyKeywords) ? c.technologyKeywords : [],
        targetBuyerTypes: Array.isArray(c.targetBuyerTypes) ? c.targetBuyerTypes : [],
        targetMarkets: Array.isArray(c.targetMarkets) ? c.targetMarkets : [],
        certifications: Array.isArray(c.certifications) ? c.certifications : [],
        exportReadiness: c.exportReadiness || '',
        dataConfidence: c.dataConfidence || '',
        axDataSources: Array.isArray(c.axDataSources) ? c.axDataSources : [],
        missingFields: Array.isArray(c.missingFields) ? c.missingFields : [],
        riskNotes: Array.isArray(c.riskNotes) ? c.riskNotes : [],
        matchSummary: c.matchSummary || '',
        axProfileStatus: status,
        axProfileGeneratedAt: c.axProfileGeneratedAt || null,
      },
    };
  }

  /**
   * AX 프로필 PDF 파일의 디스크 절대 경로를 해결한다.
   * 파일명이 허용 폴더(pdf_profiles) 밖으로 나가는 경로 순회를 차단한다.
   */
  private resolveAxProfilePdfPath(fileName?: string): string | null {
    if (!fileName || typeof fileName !== 'string') return null;
    const base = path.resolve(AX_PROFILE_PDF_DIR);
    const target = path.resolve(base, fileName);
    if (target !== base && !target.startsWith(base + path.sep)) return null;
    if (!/\.pdf$/i.test(target) || !fs.existsSync(target)) return null;
    return target;
  }

  /**
   * 기업의 AX 프로필 PDF를 다운로드용으로 반환한다.
   */
  async getAxProfilePdf(id: string) {
    const company = await this.companyModel.findById(id).lean().exec();
    if (!company) throw new NotFoundException('Company not found');

    const c = company as any;
    const pdfPath = this.resolveAxProfilePdfPath(c.axProfilePdf?.fileName);
    if (!pdfPath) {
      throw new NotFoundException('이 기업의 AX 프로필 PDF가 없습니다.');
    }
    return {
      filePath: pdfPath,
      fileName: c.axProfilePdf.fileName as string,
    };
  }

  async create(dto: CreateCompanyDto): Promise<CompanyDocument> {
    const doc = await this.companyModel.create(dto);
    if (!doc.images || doc.images.length === 0) {
      doc.images = [
        {
          url: DEFAULT_IMAGE_URL,
          caption: 'Default image',
          alt: doc.name,
          tags: [],
          clipEmbedding: [],
        },
      ];
      await doc.save();
    }
    return doc;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument> {
    const fields = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    );
    if (Object.keys(fields).length === 0) {
      throw new BadRequestException('수정할 필드를 하나 이상 제공해야 합니다');
    }
    const doc = await this.companyModel
      .findByIdAndUpdate(
        id,
        { ...fields, updatedAt: new Date() },
        { new: true, runValidators: true },
      )
      .exec();
    if (!doc) throw new NotFoundException('Company not found');
    return doc;
  }

  async remove(id: string): Promise<void> {
    const doc = await this.companyModel.findByIdAndDelete(id).exec();
    if (!doc) throw new NotFoundException('Company not found');
  }

  /** 출처 라벨 정리: "(담당자)" 접두어, 날짜 접두어, 확장자 제거 */
  private shortenSourceLabel(raw: string): string {
    const s = String(raw ?? '');
    return (
      s
        .replace(/^\([^)]*\)\s*/g, '')
        .replace(/^\d{6}_/, '')
        .replace(/\.(xlsx|xls)$/i, '')
        .trim() || s
    );
  }

  /** 제품군 라벨 정리: "English\ Español; Next" → 첫 영문 세그먼트 */
  private shortenProductLabel(raw: string): string {
    const s = String(raw ?? '');
    const first = s.split(';')[0].trim();
    return (first.split('\\')[0] || first).trim() || s;
  }

  /**
   * MongoDB KOAA SHOW 클러스터 실시간 통계.
   * 하드코딩 없이 `companies` 컬렉션 실측 집계만 반환한다.
   * - 국내업체: type='domestic', canonical_id(중복 병합된 고유 업체 ID) 기준 엔티티 수
   *   (병합 미적재 시 문서 수로 폴백)
   * - 바이어(잠재): type in ['foreign','overseas']
   * - 검증된 바이어: 검증 워크플로우 컬렉션(buyer_invitations 회신 /
   *   buyer_candidate_reviews 담당자 승인)에서 실시간 산출
   */
  private async getBuyerVerificationSets() {
    const buyerFilter = { type: { $in: ['foreign', 'overseas'] } };
    const companiesCol = this.connection.collection('companies');
    const invitationCol = this.connection.collection('buyer_invitations');
    const reviewCol = this.connection.collection('buyer_candidate_reviews');
    const [respondedRaw, approvedRaw, buyerDocumentIds] = await Promise.all([
      invitationCol.distinct('buyerId', {
        invitationStatus: { $in: ['responded_interested', 'attendance_confirmed'] },
      }),
      reviewCol.distinct('buyerId', { status: 'approved_to_invite' }),
      companiesCol.distinct('_id', buyerFilter),
    ]);

    // 검증 워크플로우에만 남은 데모/삭제 ID가 바이어 수를 부풀리지 않도록
    // companies의 실제 foreign/overseas 문서와 교집합만 인정한다.
    const validBuyerIds = new Set((buyerDocumentIds as unknown[]).map(String));
    const respondedInviteIds = (respondedRaw as unknown[])
      .map(String)
      .filter((id) => validBuyerIds.has(id));
    const adminApprovedIds = (approvedRaw as unknown[])
      .map(String)
      .filter((id) => validBuyerIds.has(id));
    const verifiedIds = new Set([...respondedInviteIds, ...adminApprovedIds]);

    return { respondedInviteIds, adminApprovedIds, verifiedIds };
  }

  async getClusterStats() {
    const col = this.connection.collection('companies');
    const buyerFilter = { type: { $in: ['foreign', 'overseas'] } };

    // 필드 보유 판정: 문자열 타입이면서 공백 제거 후 비어있지 않아야 함.
    // 주의: $ne는 missing 필드를 null과 다르게 보므로 반드시 $type 검사를 함께 쓴다
    // (missing을 보유로 잘못 세는 오류 방지).
    const notEmpty = (f: string) => ({
      $cond: [
        {
          $and: [
            { $eq: [{ $type: `$${f}` }, 'string'] },
            { $ne: [{ $trim: { input: `$${f}` } }, ''] },
          ],
        },
        1,
        0,
      ],
    });

    // 엔티티(canonical_id) 단위 연락처 보유 집계
    const [entityAgg, buyerContactAgg, docTotal, buyerTotal] = await Promise.all([
      col
        .aggregate<{
          entities: number;
          withEmail: number;
          withWebsite: number;
          withBoth: number;
        }>([
          { $match: { type: 'domestic', canonical_id: { $exists: true } } },
          {
            $group: {
              _id: '$canonical_id',
              hasEmail: { $max: notEmpty('email') },
              hasWebsite: { $max: notEmpty('website') },
            },
          },
          {
            $group: {
              _id: null,
              entities: { $sum: 1 },
              withEmail: { $sum: '$hasEmail' },
              withWebsite: { $sum: '$hasWebsite' },
              withBoth: {
                $sum: {
                  $cond: [
                    { $and: [{ $eq: ['$hasEmail', 1] }, { $eq: ['$hasWebsite', 1] }] },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray(),
      // 해외 바이어 연락처 보유 (문서 단위 실측)
      col
        .aggregate<{ _id: null; n: number; withEmail: number; withWebsite: number }>([
          { $match: buyerFilter },
          {
            $group: {
              _id: null,
              n: { $sum: 1 },
              withEmail: { $sum: notEmpty('email') },
              withWebsite: { $sum: notEmpty('website') },
            },
          },
        ])
        .toArray(),
      col.countDocuments({ type: 'domestic' }),
      col.countDocuments(buyerFilter),
    ]);

    const entity = entityAgg[0];
    const domesticTotal = entity?.entities ?? docTotal; // 병합 미적재 시 폴백
    const withEmail = entity?.withEmail ?? 0;
    const withWebsite = entity?.withWebsite ?? 0;
    const withBoth = entity?.withBoth ?? 0;
    const buyerContact = buyerContactAgg[0];

    const toPct = (n: number) =>
      domesticTotal > 0 ? Math.round((n / domesticTotal) * 1000) / 10 : 0;

    // 국내업체 수집 출처(source_group) 분포
    const sourceGroups = await col
      .aggregate<{ _id: string | null; n: number }>([
        { $match: { type: 'domestic' } },
        { $group: { _id: '$original_data.source_group', n: { $sum: 1 } } },
        { $sort: { n: -1 } },
      ])
      .toArray();

    const crmCount =
      sourceGroups.find((g) => g._id === '일반 CRM 데이터')?.n ?? 0;
    const unknownCount = sourceGroups.find((g) => g._id === null)?.n ?? 0;
    const externalCount = Math.max(domesticTotal - crmCount - unknownCount, 0);

    const productGroupDefinitions = [
      { id: 'powertrain_thermal', name: '엔진·동력전달·열관리' },
      { id: 'chassis_control', name: '섀시·조향·제동·현가' },
      { id: 'body_interior', name: '차체·내외장·의장' },
      { id: 'electrics_future', name: '전장·전동화·미래차' },
      { id: 'materials_process', name: '소재·가공·금형·생산설비' },
      { id: 'vehicle_aftermarket_other', name: '특장차·완성차·애프터마켓·기타' },
    ];
    const productGroupAgg = await col
      .aggregate<{ _id: string | null; n: number }>([
        { $match: { type: 'domestic', canonical_id: { $exists: true } } },
        {
          $group: {
            _id: '$canonical_id',
            productGroup: { $max: '$koaa_product_group' },
          },
        },
        { $group: { _id: '$productGroup', n: { $sum: 1 } } },
      ])
      .toArray();
    const productCountMap = new Map(
      productGroupAgg.filter((row) => row._id).map((row) => [row._id as string, row.n]),
    );
    const categories = productGroupDefinitions.map((group) => ({
      id: group.id,
      name: group.name,
      count: productCountMap.get(group.id) ?? 0,
      percentage: toPct(productCountMap.get(group.id) ?? 0),
    }));
    const classifiedTotal = categories.reduce((sum, group) => sum + group.count, 0);
    const unclassified = Math.max(domesticTotal - classifiedTotal, 0);

    // 바이어 국가별 분포 (실측)
    const countryAgg = await col
      .aggregate<{ _id: string | null; n: number }>([
        { $match: buyerFilter },
        { $group: { _id: '$country', n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 8 },
      ])
      .toArray();
    const byCountry = countryAgg.map((g) => ({
      country: g._id ?? '(미상)',
      count: g.n,
      flag: CompaniesService.COUNTRY_FLAGS[g._id ?? ''] ?? '🌐',
    }));

    // 바이어 제품군 분포 (original_data.product_groups 실측)
    const productAgg = await col
      .aggregate<{ _id: string | null; n: number }>([
        {
          $match: {
            ...buyerFilter,
            'original_data.product_groups': { $exists: true, $nin: [null, ''] },
          },
        },
        { $group: { _id: '$original_data.product_groups', n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 6 },
      ])
      .toArray();
    const byCategory = productAgg.map((g) => ({
      name: this.shortenProductLabel(g._id as string),
      count: g.n,
    }));

    // 검증 채널 실시간 산출: 실제 buyers 문서와 교차검증된 ID만 인정
    const { respondedInviteIds, adminApprovedIds, verifiedIds } =
      await this.getBuyerVerificationSets();
    const verified = verifiedIds.size;
    const potential = Math.max(buyerTotal - verified, 0);

    return {
      updatedAt: new Date().toISOString(),
      domesticCompanies: {
        total: domesticTotal,
        mergedFromDocuments: docTotal,
        contacts: {
          withEmail,
          withoutEmail: Math.max(domesticTotal - withEmail, 0),
          withWebsite,
          withoutWebsite: Math.max(domesticTotal - withWebsite, 0),
          withBoth,
        },
        categories,
        productClassification: {
          source: '국내CRM(1) 주요품목·수출 희망 품목·Products·상품소개(국문)',
          classified: classifiedTotal,
          unclassified,
        },
        groups: [
          { label: '일반 CRM 데이터', count: crmCount, note: 'KOAA SHOW 자체 CRM' },
          { label: '외부 수집 DB (엑셀 원장)', count: externalCount, note: 'KOTRA·KAICA·협회·전시회 등' },
          { label: '출처 미상', count: unknownCount, note: 'source_group 미기재' },
        ],
      },
      buyers: {
        total: buyerTotal,
        contacts: {
          withEmail: buyerContact?.withEmail ?? 0,
          withWebsite: buyerContact?.withWebsite ?? 0,
        },
        verificationStatus: {
          potential,
          verified,
          channels: [
            { id: 'inquiry', label: '📧 소싱 인콰이어리 수신', count: 0, desc: '수신 체계 구축 전 — 구축 후 실시간 집계 예정' },
            { id: 'email_response', label: '📩 초청/홍보 메일 회신', count: respondedInviteIds.length, desc: '초청 메일 회신/참석 확정 (실제 바이어 문서 교차검증)' },
            { id: 'admin_verified', label: '👤 담당자 직접 검증', count: adminApprovedIds.length, desc: '담당자 검토 승인 (실제 바이어 문서 교차검증)' },
          ],
        },
        byCountry,
        byCategory,
      },
    };
  }

  /** 고유 국내업체 분류별 엑셀 다운로드 */
  async exportDomesticCompaniesExcel(category: string): Promise<{
    buffer: Buffer;
    fileName: string;
    count: number;
  }> {
    const categories = {
      all: { label: '전체', sheet: '전체 국내업체' },
      'with-email': { label: '이메일보유', sheet: '이메일 보유 업체' },
      'without-email': { label: '이메일미보유', sheet: '이메일 미보유 업체' },
      'with-website': { label: '웹사이트보유', sheet: '웹사이트 보유 업체' },
      'without-website': { label: '웹사이트미보유', sheet: '웹사이트 미보유 업체' },
      'with-both': { label: '이메일웹사이트보유', sheet: '이메일 웹사이트 보유' },
    } as const;
    const selected = categories[category as keyof typeof categories];
    if (!selected) {
      throw new BadRequestException('지원하지 않는 국내업체 엑셀 분류입니다.');
    }

    const col = this.connection.collection('companies');
    const groupedMatch: Record<string, number> = {};
    if (category === 'with-email') groupedMatch.hasEmail = 1;
    if (category === 'without-email') groupedMatch.hasEmail = 0;
    if (category === 'with-website') groupedMatch.hasWebsite = 1;
    if (category === 'without-website') groupedMatch.hasWebsite = 0;
    if (category === 'with-both') {
      groupedMatch.hasEmail = 1;
      groupedMatch.hasWebsite = 1;
    }
    const rows = await col
      .aggregate<Record<string, unknown>>([
        { $match: { type: 'domestic', canonical_id: { $exists: true } } },
        {
          $group: {
            _id: '$canonical_id',
            hasEmail: { $max: this.notEmptyAgg('email') },
            hasWebsite: { $max: this.notEmptyAgg('website') },
            names: { $push: '$company_name' },
            emails: { $push: '$email' },
            regions: { $push: '$region' },
            industries: { $push: '$industry' },
            websites: { $push: '$website' },
            sources: { $push: '$original_data.source_group' },
          },
        },
        ...(Object.keys(groupedMatch).length > 0 ? [{ $match: groupedMatch }] : []),
      ])
      .toArray();

    const filled = (arr: unknown[]): string[] =>
      Array.from(
        new Set(
          (arr ?? [])
            .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
            .map((v) => v.trim()),
        ),
      );
    const firstFilled = (arr: unknown[]): string => filled(arr)[0] ?? '';
    const joined = (arr: unknown[]): string => filled(arr).join('; ');

    const data = rows
      .map((r) => ({
        회사명: firstFilled(r.names as unknown[]),
        이메일: joined(r.emails as unknown[]),
        웹사이트: joined(r.websites as unknown[]),
        지역: firstFilled(r.regions as unknown[]),
        '업종/품목': firstFilled(r.industries as unknown[]),
        '수집 출처': joined(r.sources as unknown[]),
      }))
      .filter((r) => r.회사명 !== '')
      .sort((a, b) => a.회사명.localeCompare(b.회사명, 'ko'));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 32 },
      { wch: 42 },
      { wch: 42 },
      { wch: 24 },
      { wch: 32 },
      { wch: 44 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selected.sheet);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `KOAA_SHOW_국내업체_${selected.label}_${dateStr}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return { buffer, fileName, count: data.length };
  }

  /** 잠재/확정 바이어 목록을 companies 실데이터 기준으로 엑셀로 내보낸다. */
  async exportBuyersExcel(status: string): Promise<{
    buffer: Buffer;
    fileName: string;
    count: number;
  }> {
    if (!['potential', 'verified'].includes(status)) {
      throw new BadRequestException('바이어 상태는 potential 또는 verified여야 합니다.');
    }

    const buyerFilter = { type: { $in: ['foreign', 'overseas'] } };
    const col = this.connection.collection('companies');
    const { respondedInviteIds, adminApprovedIds, verifiedIds } =
      await this.getBuyerVerificationSets();
    const respondedSet = new Set(respondedInviteIds);
    const approvedSet = new Set(adminApprovedIds);
    const docs = await col
      .find(buyerFilter)
      .project({
        company_name: 1,
        name: 1,
        country: 1,
        region: 1,
        industry: 1,
        email: 1,
        website: 1,
        original_data: 1,
      })
      .toArray();

    const selected = docs.filter((doc) => {
      const isVerified = verifiedIds.has(String(doc._id));
      return status === 'verified' ? isVerified : !isVerified;
    });
    const data = selected
      .map((doc) => {
        const original = (doc.original_data ?? {}) as Record<string, unknown>;
        const id = String(doc._id);
        const channels = [
          respondedSet.has(id) ? '초청·홍보 메일 회신/참석 확정' : '',
          approvedSet.has(id) ? '담당자 직접 승인' : '',
        ].filter(Boolean);
        return {
          바이어명: String(doc.company_name ?? doc.name ?? ''),
          국가: String(doc.country ?? original.country ?? ''),
          '도시/지역': String(doc.region ?? original.city ?? ''),
          이메일: String(doc.email ?? original.email ?? ''),
          웹사이트: String(doc.website ?? original.website ?? ''),
          전화번호: String(original.phone ?? ''),
          '관심 제품군': String(
            original.product_groups ?? doc.industry ?? '',
          ),
          전시회: String(original.event_name ?? ''),
          '홀/부스': String(original.hall_stand ?? ''),
          바이어상태: status === 'verified' ? '확정 바이어' : '잠재 바이어',
          검증방식: channels.join('; ') || '검증 전',
          '공식 출처': String(original.profile_url ?? original.source_url ?? ''),
        };
      })
      .sort((a, b) =>
        a.국가.localeCompare(b.국가, 'ko') ||
        a.바이어명.localeCompare(b.바이어명, 'ko'),
      );

    const headers = [
      '바이어명',
      '국가',
      '도시/지역',
      '이메일',
      '웹사이트',
      '전화번호',
      '관심 제품군',
      '전시회',
      '홀/부스',
      '바이어상태',
      '검증방식',
      '공식 출처',
    ];
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    ws['!cols'] = [
      { wch: 34 }, { wch: 18 }, { wch: 28 }, { wch: 34 },
      { wch: 38 }, { wch: 22 }, { wch: 36 }, { wch: 34 },
      { wch: 18 }, { wch: 16 }, { wch: 34 }, { wch: 56 },
    ];
    const wb = XLSX.utils.book_new();
    const sheetName = status === 'verified' ? '확정 바이어' : '잠재 바이어';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `KOAA_SHOW_${sheetName}_${dateStr}.xlsx`;
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return { buffer, fileName, count: data.length };
  }

  /** 기존 URL 호환용 */
  exportDomesticNoEmailExcel() {
    return this.exportDomesticCompaniesExcel('without-email');
  }

  /** getClusterStats의 notEmpty와 동일한 판정을 집계용으로 재사용 */
  private notEmptyAgg(f: string) {
    return {
      $cond: [
        {
          $and: [
            { $eq: [{ $type: `$${f}` }, 'string'] },
            { $ne: [{ $trim: { input: `$${f}` } }, ''] },
          ],
        },
        1,
        0,
      ],
    };
  }

  private static readonly COUNTRY_FLAGS: Record<string, string> = {
    Mexico: '🇲🇽',
    China: '🇨🇳',
    'United States': '🇺🇸',
    USA: '🇺🇸',
    Taiwan: '🇹🇼',
    'Hong Kong': '🇭🇰',
    Germany: '🇩🇪',
    India: '🇮🇳',
    Indonesia: '🇮🇩',
    Canada: '🇨🇦',
    Vietnam: '🇻🇳',
    'United Arab Emirates': '🇦🇪',
    Malaysia: '🇲🇾',
    Türkiye: '🇹🇷',
    Japan: '🇯🇵',
    'Great Britain and Northern Ireland': '🇬🇧',
  };
}

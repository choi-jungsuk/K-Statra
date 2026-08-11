import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Company } from './schemas/company.schema';

function buildQueryMock(resolvedValue: any) {
  const mock: any = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    collation: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(resolvedValue),
  };
  return mock;
}

const makeCompanyModel = (overrides = {}) => ({
  find: jest.fn().mockReturnValue(buildQueryMock([])),
  findById: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findByIdAndUpdate: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  findByIdAndDelete: jest
    .fn()
    .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
  countDocuments: jest.fn().mockResolvedValue(0),
  estimatedDocumentCount: jest.fn().mockResolvedValue(0),
  create: jest.fn(),
  ...overrides,
});

const VALID_ID = '507f1f77bcf86cd799439011';

const makeConnectionMock = () => {
  const collectionMock = {
    countDocuments: jest.fn().mockResolvedValue(0),
    distinct: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
  };
  return {
    connection: { collection: jest.fn().mockReturnValue(collectionMock) },
    collection: collectionMock,
  };
};

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyModel: ReturnType<typeof makeCompanyModel>;
  let connMocks: ReturnType<typeof makeConnectionMock>;

  beforeEach(async () => {
    companyModel = makeCompanyModel();
    connMocks = makeConnectionMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getModelToken(Company.name), useValue: companyModel },
        { provide: getConnectionToken(), useValue: connMocks.connection },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  // ── findAll ───────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('필터 없을 때 estimatedDocumentCount 사용', async () => {
      companyModel.find.mockReturnValue(buildQueryMock([]));
      companyModel.estimatedDocumentCount.mockResolvedValue(50);

      const result = await service.findAll({} as any);

      expect(companyModel.estimatedDocumentCount).toHaveBeenCalled();
      expect(result.total).toBe(50);
    });

    it('필터 있을 때 countDocuments 사용', async () => {
      companyModel.find.mockReturnValue(buildQueryMock([]));
      companyModel.countDocuments.mockResolvedValue(5);

      const result = await service.findAll({ q: 'acme' } as any);

      expect(companyModel.countDocuments).toHaveBeenCalled();
      expect(result.total).toBe(5);
    });

    it('q 검색 시 $text 필터 적용', async () => {
      companyModel.find.mockReturnValue(buildQueryMock([]));

      await service.findAll({ q: 'acme' } as any);

      expect(companyModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: 'acme' } }),
        expect.any(Object),
      );
    });

    it('nameNumeric 정렬 시 collation 적용', async () => {
      const qm = buildQueryMock([]);
      companyModel.find.mockReturnValue(qm);

      await service.findAll({ sortBy: 'nameNumeric' } as any);

      expect(qm.collation).toHaveBeenCalledWith({
        locale: 'en',
        numericOrdering: true,
      });
    });

    it('dart.corpCode 있으면 dartVerified=true로 변환', async () => {
      const raw = [
        { _id: VALID_ID, name: 'Acme', dart: { corpCode: 'ABC123' } },
      ];
      companyModel.find.mockReturnValue(buildQueryMock(raw));

      const result = await service.findAll({} as any);

      expect(result.data[0].dartVerified).toBe(true);
      expect((result.data[0] as any).dart).toBeUndefined();
    });

    it('dart 없으면 dartVerified=false', async () => {
      const raw = [{ _id: VALID_ID, name: 'Acme', dart: null }];
      companyModel.find.mockReturnValue(buildQueryMock(raw));

      const result = await service.findAll({} as any);

      expect(result.data[0].dartVerified).toBe(false);
    });

    it('totalPages 올림 계산', async () => {
      companyModel.find.mockReturnValue(buildQueryMock([]));
      companyModel.estimatedDocumentCount.mockResolvedValue(21);

      const result = await service.findAll({ limit: 10 } as any);

      expect(result.totalPages).toBe(3);
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('존재하는 기업 반환', async () => {
      const company = { _id: VALID_ID, name: 'Acme' };
      companyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(company),
      });

      expect(await service.findById(VALID_ID)).toEqual(company);
    });

    it('없으면 NotFoundException', async () => {
      companyModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findById(VALID_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('이미지 있으면 플레이스홀더 미삽입', async () => {
      const doc = {
        _id: VALID_ID,
        name: 'Acme',
        images: [{ url: 'http://img.com/a.jpg' }],
        save: jest.fn(),
      };
      companyModel.create.mockResolvedValue(doc);

      await service.create({ name: 'Acme' } as any);

      expect(doc.save).not.toHaveBeenCalled();
    });

    it('이미지 없으면 플레이스홀더 삽입 후 save', async () => {
      const doc = { _id: VALID_ID, name: 'Acme', images: [], save: jest.fn() };
      companyModel.create.mockResolvedValue(doc);

      await service.create({ name: 'Acme' } as any);

      expect(doc.images).toHaveLength(1);
      expect(doc.save).toHaveBeenCalled();
    });
  });

  // ── update ────────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('존재하는 기업 수정', async () => {
      const updated = { _id: VALID_ID, name: 'New Name' };
      companyModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      expect(
        await service.update(VALID_ID, { name: 'New Name' } as any),
      ).toEqual(updated);
    });

    it('없는 기업 → NotFoundException', async () => {
      companyModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.update(VALID_ID, { name: 'x' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('빈 dto → BadRequestException', async () => {
      await expect(service.update(VALID_ID, {} as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ── remove ────────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('존재하는 기업 삭제', async () => {
      companyModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: VALID_ID }),
      });

      await expect(service.remove(VALID_ID)).resolves.toBeUndefined();
    });

    it('없는 기업 → NotFoundException', async () => {
      companyModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.remove(VALID_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getAxProfile ──────────────────────────────────────────────────────────────

  describe('getAxProfile', () => {
    it('AX 프로필 필드가 없는 기업 → available: false', async () => {
      companyModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: VALID_ID, name: 'Acme' }),
        }),
      });

      const res = await service.getAxProfile(VALID_ID);
      expect(res.available).toBe(false);
      expect(res.status).toBe('not_started');
      expect(res.profile).toBeNull();
    });

    it('상태만 generated이고 내용 없음 → available: false', async () => {
      companyModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: VALID_ID,
            name: 'Acme',
            axProfileStatus: 'generated',
          }),
        }),
      });

      const res = await service.getAxProfile(VALID_ID);
      expect(res.available).toBe(false);
      expect(res.status).toBe('generated');
      expect(res.profile).toBeNull();
    });

    it('실제 핵심 필드와 generated 상태 → available: true', async () => {
      companyModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: VALID_ID,
            name: 'Acme',
            axProfileStatus: 'generated',
            companySummary: '주요 자동차 부품 제조업체',
          }),
        }),
      });

      const res = await service.getAxProfile(VALID_ID);
      expect(res.available).toBe(true);
      expect(res.status).toBe('generated');
      expect(res.profile).not.toBeNull();
      expect(res.profile!.companySummary).toBe('주요 자동차 부품 제조업체');
    });

    it('reviewed 상태와 실제 내용 → available: true', async () => {
      companyModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            _id: VALID_ID,
            name: 'Acme',
            axProfileStatus: 'reviewed',
            profileText: '글로벌 수출 검증 프로필',
          }),
        }),
      });

      const res = await service.getAxProfile(VALID_ID);
      expect(res.available).toBe(true);
      expect(res.status).toBe('reviewed');
      expect(res.profile).not.toBeNull();
    });

    it('존재하지 않는 기업 ID → NotFoundException 404', async () => {
      companyModel.findById.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.getAxProfile(VALID_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getClusterStats ───────────────────────────────────────────────────────────

  describe('getClusterStats', () => {
    const makeCompaniesCol = (
      entityRow: Record<string, number> | null,
      docTotal: number,
      buyerTotal: number,
      buyerContactRow?: Record<string, number>,
      productGroupRows: Array<{ _id: string; n: number }> = [],
    ) => ({
      countDocuments: jest
        .fn()
        .mockResolvedValueOnce(docTotal)
        .mockResolvedValueOnce(buyerTotal),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest
          .fn()
          .mockResolvedValueOnce(entityRow ? [entityRow] : [])
          .mockResolvedValueOnce(buyerContactRow ? [buyerContactRow] : [])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce(productGroupRows)
          .mockResolvedValue([]),
      }),
      distinct: jest.fn().mockResolvedValue([]),
    });

    it('canonical_id 엔티티 기준 국내업체 수와 연락처 보유 반환', async () => {
      const companiesCol = makeCompaniesCol(
        { entities: 27445, withEmail: 18049, withWebsite: 719, withBoth: 660 },
        31568,
        749,
      );
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') return companiesCol;
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.getClusterStats();

      expect(res.domesticCompanies.total).toBe(27445);
      expect(res.domesticCompanies.mergedFromDocuments).toBe(31568);
      expect(res.domesticCompanies.contacts.withEmail).toBe(18049);
      expect(res.domesticCompanies.contacts.withoutEmail).toBe(9396);
      expect(res.domesticCompanies.contacts.withWebsite).toBe(719);
      expect(res.domesticCompanies.contacts.withBoth).toBe(660);
      expect(res.buyers.total).toBe(749);
      expect(res.buyers.verificationStatus.verified).toBe(0);
      expect(res.buyers.verificationStatus.potential).toBe(749);
    });

    it('병합 미적재(엔티티 집계 없음) 시 문서 수로 폴백', async () => {
      const companiesCol = makeCompaniesCol(null, 31568, 749);
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') return companiesCol;
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.getClusterStats();

      expect(res.domesticCompanies.total).toBe(31568);
      expect(res.domesticCompanies.contacts.withEmail).toBe(0);
    });

    it('검증 워크플로우에 승인 바이어가 있으면 verified 승격 반영', async () => {
      const companiesCol = makeCompaniesCol(
        { entities: 100, withEmail: 50, withWebsite: 10, withBoth: 5 },
        120,
        10,
      );
      companiesCol.distinct.mockResolvedValue(['b1', 'b2']);
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') return companiesCol;
        if (name === 'buyer_invitations') {
          return { distinct: jest.fn().mockResolvedValue(['b1']) };
        }
        return { distinct: jest.fn().mockResolvedValue(['b1', 'b2']) };
      });

      const res = await service.getClusterStats();

      expect(res.buyers.verificationStatus.verified).toBe(2); // 중복 제거
      expect(res.buyers.verificationStatus.potential).toBe(8);
    });

    it('바이어 연락처 보유 집계(withEmail/withWebsite)를 반환', async () => {
      const companiesCol = makeCompaniesCol(
        { entities: 27445, withEmail: 18049, withWebsite: 719, withBoth: 660 },
        31568,
        749,
        { n: 749, withEmail: 512, withWebsite: 230 },
      );
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') return companiesCol;
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.getClusterStats();

      expect(res.buyers.contacts.withEmail).toBe(512);
      expect(res.buyers.contacts.withWebsite).toBe(230);
    });

    it('출처명이 아니라 KOAA SHOW 6대 제품군 분포를 반환', async () => {
      const companiesCol = makeCompaniesCol(
        { entities: 100, withEmail: 50, withWebsite: 20, withBoth: 10 },
        120,
        10,
        undefined,
        [
          { _id: 'powertrain_thermal', n: 30 },
          { _id: 'electrics_future', n: 20 },
        ],
      );
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') return companiesCol;
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.getClusterStats();

      expect(res.domesticCompanies.categories).toHaveLength(6);
      expect(res.domesticCompanies.categories[0]).toMatchObject({
        id: 'powertrain_thermal',
        count: 30,
        percentage: 30,
      });
      expect(res.domesticCompanies.productClassification).toMatchObject({
        classified: 50,
        unclassified: 50,
      });
    });
  });

  // ── exportDomesticNoEmailExcel ────────────────────────────────────────────────

  describe('exportDomesticNoEmailExcel', () => {
    it('이메일 미보유 엔티티만 엑셀 버퍼로 내보낸다', async () => {
      const rows = [
        {
          _id: 'c1',
          hasEmail: 0,
          names: ['가나다금속', ''],
          regions: ['경기 화성시', ''],
          industries: ['금속 열처리'],
          websites: ['www.ganada.co.kr'],
          sources: ['일반 CRM 데이터'],
        },
        {
          _id: 'c2',
          hasEmail: 0,
          names: ['라마다부품'],
          regions: [],
          industries: [],
          websites: [],
          sources: [],
        },
      ];
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') {
          return {
            aggregate: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue(rows),
            }),
          };
        }
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.exportDomesticNoEmailExcel();

      expect(res.count).toBe(2);
      expect(res.fileName).toMatch(/^KOAA_SHOW_국내업체_이메일미보유_\d{8}\.xlsx$/);
      // xlsx 파일 시그니처 검증 (ZIP = PK)
      expect(res.buffer.slice(0, 2).toString()).toBe('PK');
      expect(res.buffer.length).toBeGreaterThan(1000);
    });

    it('회사명이 비어 있는 엔티티는 제외한다', async () => {
      connMocks.connection.collection.mockImplementation((name: string) => {
        if (name === 'companies') {
          return {
            aggregate: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([
                { _id: 'c1', hasEmail: 0, names: [''], regions: [], industries: [], websites: [], sources: [] },
              ]),
            }),
          };
        }
        return { distinct: jest.fn().mockResolvedValue([]) };
      });

      const res = await service.exportDomesticNoEmailExcel();
      expect(res.count).toBe(0);
    });
  });
});

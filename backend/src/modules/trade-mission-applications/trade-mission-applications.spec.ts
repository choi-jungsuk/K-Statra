import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TradeMissionApplicationsService } from './trade-mission-applications.service';
import { TradeMissionEvent } from './schemas/trade-mission-event.schema';
import { TradeMissionApplication } from './schemas/trade-mission-application.schema';

describe('TradeMissionApplicationsService', () => {
  let service: TradeMissionApplicationsService;
  let eventModelMock: any;
  let applicationModelMock: any;

  const mockEvent = {
    _id: '507f1f77bcf86cd799439011',
    slug: 'demo-mexico-auto-2026',
    nameKo: '[DEMO] 2026 멕시코 자동차부품 시장개척단',
    targetCountry: '멕시코',
    status: 'open',
    applicationDeadline: '2099-12-31',
    privacyNoticeVersion: 'v1.0',
  };

  beforeEach(async () => {
    eventModelMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    applicationModelMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradeMissionApplicationsService,
        {
          provide: getModelToken(TradeMissionEvent.name),
          useValue: eventModelMock,
        },
        {
          provide: getModelToken(TradeMissionApplication.name),
          useValue: applicationModelMock,
        },
      ],
    }).compile();

    service = module.get<TradeMissionApplicationsService>(
      TradeMissionApplicationsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPublicEventBySlug', () => {
    it('should throw NotFoundException if event does not exist', async () => {
      eventModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getPublicEventBySlug('non-existent-slug'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return public event info if event exists', async () => {
      eventModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      const result = await service.getPublicEventBySlug(
        'demo-mexico-auto-2026',
      );
      expect(result.slug).toBe('demo-mexico-auto-2026');
      expect(result.nameKo).toBe('[DEMO] 2026 멕시코 자동차부품 시장개척단');
      expect(result.isClosed).toBe(false);
    });
  });

  describe('submitApplication', () => {
    const validDto = {
      companyNameKo: '[DEMO] 테크플로우',
      location: '경기도 성남시',
      industry: '자동차 부품',
      products: '스마트 센서',
      contactName: '배성민',
      contactEmail: 'demo@ainglobalax.com',
      contactPhone: '010-1234-5678',
      participationProducts: '차량용 센서',
      privacyConsent: true,
    };

    it('should throw BadRequestException if event status is closed', async () => {
      eventModelMock.findOne.mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockEvent, status: 'closed' }),
      });

      await expect(
        service.submitApplication('demo-mexico-auto-2026', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on duplicate email submission', async () => {
      eventModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      applicationModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: 'app_existing',
          contactEmail: 'demo@ainglobalax.com',
        }),
      });

      await expect(
        service.submitApplication('demo-mexico-auto-2026', validDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully submit and generate application number', async () => {
      eventModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockEvent),
      });

      applicationModelMock.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      applicationModelMock.create.mockImplementation(async (doc) => ({
        ...doc,
        _id: 'app_new_123',
        createdAt: new Date(),
      }));

      const result = await service.submitApplication(
        'demo-mexico-auto-2026',
        validDto,
      );
      expect(result.success).toBe(true);
      expect(result.applicationNumber).toMatch(/^TM2026-[A-Z0-9]{6}$/);
      expect(result.companyNameKo).toBe('[DEMO] 테크플로우');
    });
  });
});

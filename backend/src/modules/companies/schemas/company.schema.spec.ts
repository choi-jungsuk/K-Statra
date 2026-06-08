import { CompanySchema } from './company.schema';

describe('CompanySchema AX profile fields', () => {
  it('KOAA SHOW AX 기본 식별 필드를 가진다', () => {
    expect(CompanySchema.path('companyNameKo')).toBeDefined();
    expect(CompanySchema.path('companyNameEn')).toBeDefined();
    expect(CompanySchema.path('country')).toBeDefined();
    expect(CompanySchema.path('subIndustry')).toBeDefined();
    expect(CompanySchema.path('boothNumber')).toBeDefined();
    expect(CompanySchema.path('exhibitionName')).toBeDefined();
    expect(CompanySchema.path('brochureUrl')).toBeDefined();
    expect(CompanySchema.path('exhibitorCategory')).toBeDefined();
  });

  it('AX 기업 프로필 핵심 배열 필드를 가진다', () => {
    expect(CompanySchema.path('mainProducts')).toBeDefined();
    expect(CompanySchema.path('productKeywords')).toBeDefined();
    expect(CompanySchema.path('technologyKeywords')).toBeDefined();
    expect(CompanySchema.path('targetBuyerTypes')).toBeDefined();
    expect(CompanySchema.path('targetMarkets')).toBeDefined();
    expect(CompanySchema.path('certifications')).toBeDefined();
    expect(CompanySchema.path('buyerMatchingKeywords')).toBeDefined();
    expect(CompanySchema.path('recommendedSearchQueries')).toBeDefined();
  });

  it('AX 상태와 품질 등급 enum을 제한한다', () => {
    expect(CompanySchema.path('exportReadiness').enumValues).toEqual([
      'unknown',
      'low',
      'medium',
      'high',
    ]);
    expect(CompanySchema.path('dataConfidence').enumValues).toEqual([
      'A',
      'B',
      'C',
      'D',
    ]);
    expect(CompanySchema.path('axProfileStatus').enumValues).toEqual([
      'not_started',
      'draft',
      'generated',
      'reviewed',
    ]);
  });

  it('AX 데이터 출처와 AI 매칭 리포트 중첩 필드를 가진다', () => {
    expect(CompanySchema.path('axDataSources')).toBeDefined();
    expect(CompanySchema.path('aiMatchingReport.markdown')).toBeDefined();
    expect(CompanySchema.path('aiMatchingReport.reportId')).toBeDefined();
    expect(CompanySchema.path('aiMatchingReport.generatedAt')).toBeDefined();
  });
});

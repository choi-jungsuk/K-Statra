# K-Statra AX 데이터 DB 구현 계획

작성일: 2026-06-07  
대상 프로젝트: K-Statra  
작업 기준 문서: `PROJECT_CONTEXT.md`, `docs/K-Statra AX 데이터 DB & KOAA SHOW PoC 전략 문서.md`

---

## 1. 목표

K-Statra의 KOAA SHOW PoC를 위해 기존 회사 DB를 AX 데이터 DB 구조로 확장하고, 참가기업 원시 데이터를 AI 매칭 가능한 기업 프로필과 기업별 글로벌 바이어 매칭 리포트로 전환하는 기능을 구현한다.

핵심 목표는 다음과 같다.

1. KOAA SHOW 참가기업 샘플 20개를 저장할 수 있다.
2. 각 기업의 기본 정보, 홈페이지, 브로슈어, 전시 품목을 바탕으로 AX 기업 프로필을 생성한다.
3. AX 기업 프로필에는 제품, 기술, 바이어 유형, 목표 시장, 인증, 데이터 신뢰도, 누락 정보가 포함된다.
4. AX 기업 프로필을 기반으로 기업별 AI 글로벌 바이어 매칭 리포트를 생성한다.
5. 관리자/운영자가 AX 프로필과 리포트를 화면에서 확인할 수 있다.

---

## 2. 현재 상태 요약

### 이미 작성된 전략 문서

- `docs/K-Statra AX 데이터 DB & KOAA SHOW PoC 전략 문서.md`
- `docs/AX 기업 프로필 JSON 스키마 상세.md`
- `docs/기업별 AI 매칭 리포트 템플릿 상세.md`
- `docs/KOAA SHOW 샘플 데이터 요청서.md`
- `docs/아인글로벌 미팅용 1페이지 요약.md`

### 기존 백엔드 회사 스키마

현재 회사 스키마 위치:

```text
backend/src/modules/companies/schemas/company.schema.ts
```

현재 주요 필드:

```text
name
industry
offerings
needs
tags
profileText
website
videoUrl
location
address
sizeBucket
projectsCount
revenue
primaryContact
accuracyScore
matchAnalysis
matchRecommendation
dataSource
extractedAt
images
products
activities
dart
embedding
updatedAt
```

이 구조는 기본 회사 검색/매칭에는 사용할 수 있지만, KOAA SHOW PoC에서 필요한 AX 데이터 DB 구조에는 부족하다.

---

## 3. 구현 원칙

1. 기존 필드는 가능한 유지한다.
2. AX 프로필 필드는 기존 Company Schema에 확장 필드로 추가한다.
3. 초기에 별도 컬렉션을 만들기보다 Company 문서 내부에 AX 관련 필드를 저장한다.
4. 나중에 규모가 커지면 `ax_profiles` 별도 컬렉션으로 분리할 수 있게 구조를 과도하게 복잡하게 만들지 않는다.
5. AI 추론 결과에는 반드시 데이터 출처, 신뢰도, 누락 필드를 함께 저장한다.
6. 1차 PoC는 수동 입력 또는 기존 회사 등록 화면 확장으로 처리하고, CSV/엑셀 업로드는 2차 기능으로 둔다.

---

## 4. 1차 구현 범위

### 포함한다

- Company Schema AX 필드 확장
- DTO 필드 확장
- 회사 생성/수정/조회 시 AX 필드 처리
- AX 프로필 생성 API 설계 및 1차 구현
- AI 매칭 리포트 저장 구조 추가
- 관리자 화면에서 AX 프로필 확인

### 1차에서는 보류한다

- 대량 CSV/엑셀 업로드
- PDF 브로슈어 자동 OCR/파싱
- 실시간 글로벌 웹 바이어 검색 자동화
- PDF 리포트 출력
- 6만 개 기업/3만 개 바이어 전체 처리
- 복잡한 벡터 인덱스 튜닝

---

## 5. AX Company Schema 확장안

### 5.1 기본 AX 식별 필드

추가 후보:

```ts
@Prop({ default: '' }) companyNameKo: string;
@Prop({ default: '' }) companyNameEn: string;
@Prop({ default: 'South Korea' }) country: string;
@Prop({ default: '' }) subIndustry: string;
@Prop({ default: '' }) boothNumber: string;
@Prop({ default: '' }) exhibitionName: string;
@Prop({ default: '' }) brochureUrl: string;
@Prop({ default: '' }) exhibitorCategory: string;
```

목적:

- KOAA SHOW 참가기업 데이터와 일반 회사 데이터를 구분한다.
- 국문/영문 기업명, 부스 번호, 브로슈어 URL 등 전시회 특화 정보를 저장한다.

---

### 5.2 AX 프로필 핵심 필드

추가 후보:

```ts
@Prop({ type: [String], default: [] }) mainProducts: string[];
@Prop({ type: [String], default: [] }) productKeywords: string[];
@Prop({ type: [String], default: [] }) technologyKeywords: string[];
@Prop({ type: [String], default: [] }) targetBuyerTypes: string[];
@Prop({ type: [String], default: [] }) targetMarkets: string[];
@Prop({ type: [String], default: [] }) certifications: string[];

@Prop({ enum: ['unknown', 'low', 'medium', 'high'], default: 'unknown' })
exportReadiness: string;

@Prop({ default: '' }) companySummary: string;
@Prop({ type: [String], default: [] }) buyerMatchingKeywords: string[];
@Prop({ type: [String], default: [] }) recommendedSearchQueries: string[];
```

목적:

- AI가 매칭과 리포트 생성에 직접 사용할 수 있는 구조화 필드다.

---

### 5.3 데이터 품질·출처·리스크 필드

추가 후보:

```ts
@Schema({ _id: true, id: false })
class AxDataSource {
  @Prop({ enum: ['brochure', 'website', 'exhibitor_directory', 'web_search', 'interview', 'manual'], required: true })
  type: string;

  @Prop({ required: true }) name: string;
  @Prop() url: string;
  @Prop() retrievedAt: Date;
}

@Prop({ type: [AxDataSource], default: [] }) axDataSources: AxDataSource[];

@Prop({ enum: ['A', 'B', 'C', 'D'], default: 'D' })
dataConfidence: string;

@Prop({ type: [String], default: [] }) missingFields: string[];
@Prop({ type: [String], default: [] }) riskNotes: string[];
@Prop({ default: '' }) matchSummary: string;

@Prop({ enum: ['not_started', 'draft', 'generated', 'reviewed'], default: 'not_started' })
axProfileStatus: string;

@Prop() axProfileGeneratedAt: Date;
```

목적:

- AI 결과의 신뢰성을 표시한다.
- 아인글로벌/참가기업에게 “왜 이 추천이 나왔는지” 설명할 수 있다.

---

### 5.4 AI 매칭 리포트 저장 필드

1차에서는 리포트를 Company 문서 안에 간단히 저장한다.

```ts
@Schema({ _id: false })
class AiMatchingReport {
  @Prop({ default: '' }) reportId: string;
  @Prop({ default: '' }) title: string;
  @Prop({ default: '' }) executiveSummaryKo: string;
  @Prop({ default: '' }) executiveSummaryEn: string;
  @Prop({ type: [String], default: [] }) coreProducts: string[];
  @Prop({ type: [String], default: [] }) targetBuyerPersona: string[];
  @Prop({ type: [String], default: [] }) recommendedMarkets: string[];
  @Prop({ type: [String], default: [] }) tradeChecklist: string[];
  @Prop({ type: [String], default: [] }) missingInfo: string[];
  @Prop({ default: '' }) markdown: string;
  @Prop() generatedAt: Date;
}

@Prop({ type: AiMatchingReport })
aiMatchingReport: AiMatchingReport;
```

설명:

- `markdown` 필드는 데모 화면에서 바로 보여주기 좋다.
- 향후 PDF 출력 또는 리포트 버전 관리가 필요하면 별도 컬렉션으로 분리한다.

---

## 6. API 구현 계획

### 6.1 기존 Companies API 확장

확인/수정 후보 파일:

```text
backend/src/modules/companies/companies.controller.ts
backend/src/modules/companies/companies.service.ts
backend/src/modules/companies/dto/create-company.dto.ts
backend/src/modules/companies/dto/update-company.dto.ts
backend/src/modules/companies/dto/query-company.dto.ts
backend/src/modules/companies/schemas/company.schema.ts
```

작업:

1. Company Schema에 AX 필드 추가
2. Create DTO에 1차 입력 필드 추가
3. Update DTO에 AX 필드 수정 가능하도록 추가
4. 목록/상세 조회에서 AX 필드가 반환되는지 확인

---

### 6.2 AX 프로필 생성 API

신규 API 후보:

```http
POST /companies/:id/generate-ax-profile
GET /companies/:id/ax-profile
```

역할:

- 회사 기본 정보, 소개, 제품, 홈페이지, 브로슈어 텍스트를 AI 프롬프트에 넣는다.
- OpenAI API로 AX 프로필 JSON을 생성한다.
- 결과를 Company 문서의 AX 필드에 저장한다.

초기 요청 예:

```json
{
  "useWebsite": true,
  "useBrochure": false,
  "notes": "KOAA SHOW 1차 샘플"
}
```

초기 응답 예:

```json
{
  "companyId": "...",
  "axProfileStatus": "generated",
  "dataConfidence": "B",
  "mainProducts": [],
  "targetBuyerTypes": [],
  "recommendedSearchQueries": []
}
```

---

### 6.3 AI 매칭 리포트 생성 API

신규 API 후보:

```http
POST /companies/:id/generate-matching-report
GET /companies/:id/matching-report
```

역할:

- 저장된 AX 프로필을 기반으로 기업별 바이어 매칭 리포트 Markdown을 생성한다.
- 리포트는 1차적으로 실제 바이어 후보보다 “바이어 유형, 추천 시장, 검색 키워드, 접근 전략” 중심으로 작성한다.
- 실제 바이어 후보 웹검색은 2차 기능으로 확장한다.

---

## 7. AI 프롬프트 설계 방향

### AX 프로필 생성 프롬프트 원칙

AI에게 다음을 요구한다.

1. 반드시 JSON만 반환한다.
2. 모르는 정보는 추측하지 않고 `missing_fields`에 넣는다.
3. 추정치는 `risk_notes`에 표시한다.
4. 데이터 신뢰도 A/B/C/D를 부여한다.
5. 해외 바이어 검색에 사용할 영어 검색어를 생성한다.

### 리포트 생성 프롬프트 원칙

AI에게 다음을 요구한다.

1. 국문 중심 리포트를 생성한다.
2. 해외 바이어가 이해할 수 있는 영문 요약도 포함한다.
3. 추천 이유와 데이터 신뢰도를 분리한다.
4. 실제 바이어 후보가 없으면 “추천 바이어 유형”으로 명확히 표시한다.
5. 아인글로벌/전시회 주최자가 유료 서비스로 보여줄 수 있는 형식으로 작성한다.

---

## 8. 프론트엔드 구현 계획

### 8.1 1차 화면 후보

수정/추가 후보 파일:

```text
frontend/src/pages/CompanyList.jsx
frontend/src/pages/CompanyInputForm.jsx
frontend/src/pages/Matches.jsx
frontend/src/api.js
```

신규 후보:

```text
frontend/src/pages/AxProfilePage.jsx
frontend/src/ui/AxProfileCard.jsx
frontend/src/ui/AiMatchingReportCard.jsx
```

### 8.2 화면 흐름

```text
회사 목록
  ↓
회사 상세 / AX 프로필 보기
  ↓
[AX 프로필 생성]
  ↓
생성 결과 확인
  ↓
[AI 매칭 리포트 생성]
  ↓
리포트 Markdown 미리보기
```

### 8.3 데모 우선 UI 요소

- 데이터 품질 등급 배지: A/B/C/D
- AX 프로필 생성 상태: not_started/draft/generated/reviewed
- 주요 제품 태그
- 타깃 바이어 유형 태그
- 추천 시장 태그
- 누락 정보 목록
- 리스크 노트
- AI 매칭 리포트 미리보기

---

## 9. 테스트 및 검증 계획

### 백엔드 검증

1. Company Schema가 TypeScript 빌드에서 오류 없이 통과하는지 확인
2. 회사 생성 시 AX 입력 필드가 저장되는지 확인
3. 회사 수정 시 AX 필드가 업데이트되는지 확인
4. 회사 상세 조회 시 AX 필드가 반환되는지 확인
5. AX 프로필 생성 API가 샘플 회사 1개에 대해 JSON을 저장하는지 확인
6. AI 매칭 리포트 생성 API가 Markdown 리포트를 저장하는지 확인

### 프론트엔드 검증

1. 회사 목록에서 데이터 품질 등급 표시
2. 회사 상세에서 AX 프로필 표시
3. AX 프로필 생성 버튼 동작
4. AI 매칭 리포트 생성 버튼 동작
5. 리포트 Markdown 표시

### PoC 검증

1. 샘플 회사 1개로 전체 흐름 검증
2. 샘플 회사 3개로 품질 편차 확인
3. 샘플 회사 20개로 데모 가능성 확인
4. 아인글로벌 미팅용 리포트 1~3개 출력 또는 화면 캡처 준비

---

## 10. 개발 순서

### Phase 1. 구조 고정

1. `PROJECT_CONTEXT.md` 생성
2. 본 구현 계획 문서 생성
3. 기존 Company Schema와 AX 스키마 차이 확인

### Phase 2. 백엔드 데이터 구조 확장

1. `company.schema.ts`에 AX 필드 추가
2. DTO 필드 추가
3. 서비스/컨트롤러 영향 확인
4. 백엔드 빌드 또는 테스트 실행

### Phase 3. AX 프로필 생성 API

1. OpenAI API 사용 위치 확인
2. AX 프로필 생성 프롬프트 작성
3. `generate-ax-profile` API 추가
4. 샘플 회사 1개로 저장 테스트

### Phase 4. AI 매칭 리포트 생성 API

1. 리포트 저장 필드 추가
2. 리포트 생성 프롬프트 작성
3. `generate-matching-report` API 추가
4. Markdown 리포트 저장 테스트

### Phase 5. 프론트엔드 PoC 화면

1. 회사 상세 또는 신규 AX 페이지 구성
2. AX 프로필 필드 표시
3. 생성 버튼 추가
4. 리포트 표시 영역 추가

### Phase 6. 데모 준비

1. KOAA SHOW 샘플 회사 3개 입력
2. AX 프로필 생성
3. 리포트 생성
4. Railway 배포 확인
5. 아인글로벌 미팅용 시연 흐름 정리

---

## 11. 비용 관리 원칙

OpenAI API를 사용할 때는 다음 원칙을 지킨다.

1. 처음에는 샘플 1개 기업만 처리한다.
2. 결과 품질이 좋으면 3개로 확대한다.
3. 20개 전체 처리는 프롬프트와 응답 구조가 안정된 뒤 진행한다.
4. 대량 처리 전 예상 비용을 계산한다.
5. 브라우저 자동화와 웹검색은 실제 필요할 때만 사용한다.

MongoDB Atlas는 다음 원칙을 지킨다.

1. 초기에는 필드 확장 중심으로 진행한다.
2. 벡터 검색 인덱스는 실제 매칭 검색 단계에서 추가한다.
3. 20개 샘플 PoC에서는 과도한 인덱스를 만들지 않는다.
4. 월 비용이 50달러를 넘으면 구조를 재점검한다.

---

## 12. 다음 작업 지시문

다음 개발 단계로 들어갈 때 Hermes에게 다음처럼 지시하면 된다.

```text
K-Statra에서 AX 데이터 DB 구현 계획 문서를 기준으로 Phase 2를 진행해줘.
먼저 company.schema.ts에 AX 필드를 추가하고, 관련 DTO와 테스트/빌드를 확인해줘.
```

---

## 13. 현재 판단

지금 K-Statra는 “전략 문서 작성 단계”를 넘어 “PoC 기능 구현 단계”로 진입할 준비가 되었다.

가장 중요한 것은 화면을 크게 바꾸는 것이 아니라, 기존 회사 데이터가 AX 기업 프로필과 AI 매칭 리포트로 변환되는 핵심 흐름을 실제로 작동하게 만드는 것이다.

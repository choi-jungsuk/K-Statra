# DemoStatra Project Context

작성일: 2026-06-07  
프로젝트 전용 대화 기준: 이 Hermes 대화창은 DemoStatra 전용으로 사용한다.

---

## 1. 프로젝트 정체성

DemoStatra는 국내 스타트업·수출기업과 해외 바이어를 연결하는 AI 기반 무역 매칭 플랫폼이다.

현재 PoC의 핵심은 단순한 기업 검색 서비스가 아니라, 전시회·협회·MICE 주최자가 보유한 불완전한 참가기업 디렉토리, 브로슈어, 홈페이지, 공개 웹 정보를 AI가 활용 가능한 **AX 데이터 DB**로 전환하고, 기업별 해외 바이어 매칭 리포트를 생성하는 것이다.

---

## 2. 현재 PoC 방향

### PoC 대상

- 파트너: 아인글로벌
- 대상 전시회: KOAA SHOW
- 1차 샘플 범위: KOAA SHOW 참가기업 20개 내외

### PoC 핵심 산출물

1. KOAA SHOW 참가기업 원시 데이터 수집
2. 기업별 AX 기업 프로필 생성
3. 데이터 품질 등급 부여
4. 바이어 매칭 키워드와 권장 검색어 생성
5. 기업별 AI 글로벌 바이어 매칭 리포트 생성
6. 관리자/운영자가 확인 가능한 PoC 화면 제공

---

## 3. 핵심 전략 문서

현재 기준 문서는 다음 파일을 우선 참조한다.

- `docs/DemoStatra AX 데이터 DB & KOAA SHOW PoC 전략 문서.md`
- `docs/AX 기업 프로필 JSON 스키마 상세.md`
- `docs/기업별 AI 매칭 리포트 템플릿 상세.md`
- `docs/KOAA SHOW 샘플 데이터 요청서.md`
- `docs/아인글로벌 미팅용 1페이지 요약.md`
- `docs/AX_데이터_DB_구현_계획.md`

---

## 4. 개발·운영 도구 역할 분담

### 주력 개발 체계

- Hermes: 전략, 문서, 코드 수정, 테스트, GitHub, Railway 배포 점검의 중심 에이전트
- Antigravity: 프로젝트 폴더 확인, 코드 보기, IDE 보조 작업

### 인프라

- Railway: DemoStatra 배포
- MongoDB Atlas: 데이터 저장, 기업/바이어 DB, 벡터 검색
- OpenAI API: 주력 AI 예산 및 AX 프로필/리포트 생성 엔진

### 예비 도구

- Azure AI Agent: 예비/실험용
- Claude Managed Agent: 중요 문서·코드 리뷰용 예비
- Nous Portal/Hermes 크레딧: Hermes 도구·웹·브라우저·보조 모델 사용

---

## 5. 현재 기술 구조 요약

### 백엔드

- 위치: `backend/`
- 주요 프레임워크: NestJS
- 주요 DB: MongoDB / Mongoose
- 핵심 회사 스키마: `backend/src/modules/companies/schemas/company.schema.ts`
- 관련 모듈:
  - `companies`
  - `buyers`
  - `matches`
  - `embeddings`
  - `insights`
  - `agent`

### 프론트엔드

- 위치: `frontend/`
- 주요 프레임워크: React/Vite 계열
- 주요 화면 후보:
  - `frontend/src/pages/CompanyList.jsx`
  - `frontend/src/pages/CompanyInputForm.jsx`
  - `frontend/src/pages/Matches.jsx`
  - 신규 후보: `frontend/src/pages/AxProfilePage.jsx`

---

## 6. DemoStatra AX 데이터 DB 구현 우선순위

1. 기존 Company Schema를 AX 기업 프로필 구조와 연결한다.
2. KOAA SHOW 참가기업 샘플 20개를 입력/저장할 수 있게 한다.
3. 회사 기본 정보로 AX 프로필을 생성하는 API를 만든다.
4. AX 프로필 기반으로 AI 매칭 리포트를 생성하는 API를 만든다.
5. 관리자 화면에서 AX 프로필과 리포트를 확인할 수 있게 한다.
6. 필요 시 CSV/엑셀 업로드 기능을 추가한다.
7. Railway 배포 후 아인글로벌 미팅용 데모 흐름을 점검한다.

---

## 7. 개발 원칙

- 처음부터 6만 개 기업/3만 개 바이어 전체를 다루지 않는다.
- 1차 PoC는 KOAA SHOW 참가기업 20개 샘플로 검증한다.
- UI를 과도하게 꾸미기보다, AX 프로필과 리포트가 실제로 생성되는 흐름을 먼저 만든다.
- AI가 추론한 내용은 반드시 데이터 출처와 신뢰도 등급을 함께 저장한다.
- MongoDB Atlas 비용이 커지지 않도록 초기에는 필요한 필드와 인덱스만 사용한다.
- OpenAI API 사용 시 대량 처리 전에 샘플 1~3개로 비용과 품질을 확인한다.

---

## 8. 새 대화 시작 시 Hermes에게 알려줄 문장

다른 날 새 대화창을 열 경우 다음처럼 시작한다.

```text
이 대화는 DemoStatra 프로젝트 전용이야.
프로젝트 폴더는 D:/demostatra-project 이야.
먼저 PROJECT_CONTEXT.md를 읽고 현재 맥락을 파악한 뒤 작업해줘.
```

---

## 9. 다음 실행 후보

가장 가까운 다음 개발 작업은 다음 순서로 진행한다.

1. `backend/src/modules/companies/schemas/company.schema.ts`에 AX 프로필 관련 필드 추가
2. `create-company.dto.ts`, `update-company.dto.ts`, `query-company.dto.ts`에 필요한 필드 반영
3. 회사 상세 조회 API에서 AX 프로필 필드 반환 확인
4. AX 프로필 생성 API 설계
5. AI 매칭 리포트 저장 구조 설계
6. 프론트엔드 관리자 화면에서 AX 프로필/리포트 확인

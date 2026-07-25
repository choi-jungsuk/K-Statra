# AX 기업 프로필 JSON 스키마 상세 정의

본 문서는 DemoStatra AI 엔진이 원시 데이터(디렉토리, 브로슈어, 웹 크롤링 결과 등)를 분석하여 최종적으로 생성하고 데이터베이스(MongoDB)에 저장할 **AX 기업 프로필(AX Enterprise Profile)**의 JSON 스키마와 데이터 정의서입니다.

---

## 1. JSON 스키마 정의 (JSON Schema Draft-07 표준)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AX_Enterprise_Profile",
  "description": "DemoStatra AI가 추출한 기업 프로필 및 바이어 매칭용 메타데이터 스키마",
  "type": "object",
  "required": [
    "company_name_ko",
    "company_name_en",
    "website",
    "country",
    "industry",
    "main_products",
    "export_readiness",
    "data_confidence"
  ],
  "properties": {
    "company_name_ko": {
      "type": "string",
      "description": "국문 기업명"
    },
    "company_name_en": {
      "type": "string",
      "description": "영문 기업명"
    },
    "website": {
      "type": "string",
      "format": "uri",
      "description": "기업 공식 웹사이트 URL"
    },
    "country": {
      "type": "string",
      "default": "South Korea",
      "description": "소재 국가"
    },
    "industry": {
      "type": "string",
      "description": "대분류 산업군 (예: Automotive, Electronics, Defense, Beauty)"
    },
    "sub_industry": {
      "type": "string",
      "description": "중/소분류 산업군 (예: EV Battery Thermal Management, Advanced Materials)"
    },
    "main_products": {
      "type": "array",
      "items": { "type": "string" },
      "description": "주요 생산 제품 목록 (영문 위주)"
    },
    "product_keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "제품 분류용 핵심 키워드 목록"
    },
    "technology_keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "보유 기술 및 제조 공정 키워드 목록 (예: CNC, Aluminum Extrusion, AI-powered)"
    },
    "target_buyer_types": {
      "type": "array",
      "items": { "type": "string" },
      "description": "목표로 하는 바이어 유형 (예: EV OEM, Tier-1 Supplier, Importer, Distributor)"
    },
    "target_markets": {
      "type": "array",
      "items": { "type": "string" },
      "description": "진출 희망 국가 또는 기 진출 국가 목록 (ISO 2자리 국가코드 또는 국가명)"
    },
    "certifications": {
      "type": "array",
      "items": { "type": "string" },
      "description": "보유 인증 목록 (예: IATF 16949, ISO 9001, CE, FCC)"
    },
    "export_readiness": {
      "type": "string",
      "enum": ["unknown", "low", "medium", "high"],
      "description": "수출 준비 단계 (AI 추정치: 카탈로그 구비 여부, 영어 대응 수준, 인증 수준 기반)"
    },
    "company_summary": {
      "type": "string",
      "description": "AI가 작성한 기업 요약 설명 (영문 2~3문장)"
    },
    "buyer_matching_keywords": {
      "type": "array",
      "items": { "type": "string" },
      "description": "바이어 매칭 엔진이 매칭 대상 바이어를 필터링할 때 사용할 검색용 핵심 키워드"
    },
    "recommended_search_queries": {
      "type": "array",
      "items": { "type": "string" },
      "description": "웹 리서치 에이전트가 링크드인 또는 글로벌 웹에서 바이어를 검색할 때 사용할 권장 검색어 조합"
    },
    "data_sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["brochure", "website", "exhibitor_directory", "web_search", "interview"] },
          "name": { "type": "string", "description": "출처 파일명 또는 URL" },
          "retrieved_at": { "type": "string", "format": "date-time" }
        },
        "required": ["type", "name"]
      },
      "description": "본 프로필 데이터 수집에 기여한 원천 소스 목록"
    },
    "data_confidence": {
      "type": "string",
      "enum": ["A", "B", "C", "D"],
      "description": "데이터 신뢰도 및 완결성 등급 (A: 완전함, D: 매우 미흡함)"
    },
    "missing_fields": {
      "type": "array",
      "items": { "type": "string" },
      "description": "추가 보강이 필요한 누락 필드 목록"
    },
    "risk_notes": {
      "type": "array",
      "items": { "type": "string" },
      "description": "데이터 신뢰성 저하 요인 또는 리스크 사항 (예: 홈페이지 만료, 영문 정보 부재)"
    },
    "match_summary": {
      "type": "string",
      "description": "AI가 종합 평가한 이 기업의 가장 매력적인 무역 소구점 요약"
    }
  }
}
```

---

## 2. AX 기업 프로필 JSON 인스턴스 예시

위 스키마를 준수하여 작성된 실제 기업 프로필 데이터 예시입니다.

```json
{
  "company_name_ko": "(주)에이비씨모빌리티",
  "company_name_en": "ABC Mobility Co., Ltd.",
  "website": "http://www.abcmobility.com",
  "country": "South Korea",
  "industry": "Automotive",
  "sub_industry": "EV Battery Thermal Management Components",
  "main_products": [
    "EV battery cooling plates",
    "Thermal interface modules",
    "Lightweight aluminum battery frames"
  ],
  "product_keywords": [
    "Battery cooling plate",
    "Thermal management module",
    "EV components",
    "Aluminum heatsink"
  ],
  "technology_keywords": [
    "Aluminum extrusion",
    "Friction stir welding",
    "Precision CNC machining"
  ],
  "target_buyer_types": [
    "EV OEM Manufacturers",
    "Tier-1 Automotive Suppliers",
    "EV Battery Pack Manufacturers"
  ],
  "target_markets": [
    "United States",
    "Germany",
    "Japan"
  ],
  "certifications": [
    "IATF 16949",
    "ISO 9001",
    "ISO 14001"
  ],
  "export_readiness": "high",
  "company_summary": "ABC Mobility is a leading South Korean automotive component manufacturer specializing in electric vehicle (EV) battery cooling plates and lightweight aluminum frames. Leveraging advanced friction stir welding and extrusion technologies, the company provides high-efficiency thermal management solutions to global tier-1 suppliers.",
  "buyer_matching_keywords": [
    "ev battery cooling",
    "automotive thermal management",
    "battery plate supplier",
    "lightweight aluminum EV parts"
  ],
  "recommended_search_queries": [
    "\"battery cooling plate\" buyer OR sourcing OR procurement",
    "\"thermal management\" tier-1 automotive \"purchasing manager\"",
    "EV battery pack assembly procurement manager LinkedIn"
  ],
  "data_sources": [
    {
      "type": "brochure",
      "name": "KOAA_SHOW_2026_ABC_Mobility_Catalog_EN.pdf",
      "retrieved_at": "2026-06-06T15:30:00Z"
    },
    {
      "type": "website",
      "name": "http://www.abcmobility.com/en/products",
      "retrieved_at": "2026-06-06T16:00:00Z"
    }
  ],
  "data_confidence": "A",
  "missing_fields": [],
  "risk_notes": [],
  "match_summary": "Excellent readiness with essential certifications (IATF 16949) and English catalogs. Active targets are tier-1 EV battery pack suppliers in North America and Western Europe."
}
```

---

## 3. 데이터 품질 등급(Data Confidence) 평가 기준 세부 사양

AI 엔진은 수집된 원시 데이터의 깊이와 완결성을 평가하여 `data_confidence` 필드에 아래 4개 등급 중 하나를 부여합니다.

* **A 등급 (Perfect):** 공식 홈페이지가 활성화되어 있고, 상세 제품 스펙이 담긴 영문 카탈로그/브로슈어가 존재하며, 주요 해외 인증(IATF 16949 등) 및 수출 이력이 확인되는 상태. 추가 웹서치 없이도 AI가 즉시 해외 바이어 매칭 및 정밀 리포트를 작성할 수 있음.
* **B 등급 (Basic Matching):** 홈페이지는 존재하나 영문 정보가 부족하거나, 브로슈어가 한글로만 구성되어 있어 추가적인 AI 기계번역 및 일부 정보 보강이 필요한 상태. 기본적인 바이어 매칭은 가능하나 세부 정합성 확인 필요.
* **C 등급 (Web Enrichment Required):** 주최측 디렉토리 상의 단문 텍스트와 연락처 정보만 존재하고 상세 브로슈어가 누락된 상태. DemoStatra의 웹서치 AI 에이전트가 인터넷 검색 및 홈페이지 크롤링을 통해 데이터를 강제로 보강(Enrichment)해야만 매칭이 가능함.
* **D 등급 (Insufficient):** 홈페이지가 접속 불가능하거나 기업명 및 연락처 외에 제품/기술에 대한 정보가 극히 적어 AI가 매칭 목적을 유추하기 어려운 상태. 오프라인 문의 또는 주최자 측의 추가 기초 조사 수집이 우선되어야 함.

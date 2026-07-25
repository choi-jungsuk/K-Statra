# Antigravity 긴급 작업지시문: 우즈베키스탄 바이어 검색 결과에 웹사이트·요약·후보정보 표시

## 1. 긴급 배경

오늘 KOAA SHOW PoC 종료 발표회에서 `demostatra.com`의 우즈베키스탄 자동차부품 바이어 검색 기능을 시연할 예정이다.

현재 검색 자체는 동작하지만, 화면에는 아래처럼 **제목만 나오고 웹사이트/요약/후보정보가 거의 보이지 않는 문제**가 있다.

```text
- Auto Parts Buyers & Importers in Uzbekistan - Trademo
- Automobile Spare Parts Supplies Buyers & Importers in Uzbekistan
- LUSAUTO Auto Parts - Uzbekistan Auto Parts Wholesaler
- List of Top 43 Car Auto Parts Importers in Uzbekistan - Export Genius
- Connect with Verified Car Parts Buyers in Uzbekistan - Volza
```

상세 화면에서도 Location이 Global로만 보이고, Website가 표시되지 않거나 후보 설명이 부족하다.

오늘 발표 목적상 정확도가 조금 떨어지더라도, **최소 몇 개 결과에는 웹사이트 URL, 짧은 설명, 후보 유형, 검증 필요 문구가 보이도록 긴급 수정**한다.

---

## 2. 작업 대상

프로젝트 경로:

```text
D:/demostatra-project
```

주요 수정 후보 파일:

```text
D:/demostatra-project/backend/src/modules/partners/partners.service.ts
D:/demostatra-project/frontend/src/pages/PartnerSearch.jsx
D:/demostatra-project/frontend/src/ui/CompanyResultCard.jsx
```

공개 사이트:

```text
https://www.demostatra.com
```

백엔드:

```text
https://backend-production-601f2.up.railway.app
```

---

## 3. 현재 확인된 문제

실제 API를 호출해보면 검색 결과의 `profileText`는 어느 정도 들어오지만 `website`와 `url`이 `None/null`로 내려온다.

테스트 쿼리:

```text
Uzbekistan automotive EV parts buyer distributor importer
```

현재 응답 예시:

```text
NAME: Auto Parts Buyers & Importers in Uzbekistan - Trademo
website: None
url: None
profile: Find and discover Auto Parts buyers & importers for all products in Uzbekistan...

tags: ['Web']
```

즉, 문제는 크게 2가지다.

```text
1. 백엔드 web result mapping에서 원본 URL이 website 필드로 보존되지 않음
2. 프론트엔드 카드/상세 화면이 web result의 설명·출처·링크를 충분히 보여주지 않음
```

---

## 4. 오늘 발표용 우선 목표

완벽한 DB 구축이 아니라, 오늘 발표용 시연 안정성이 목표다.

```text
1. 검색 결과 카드에 웹사이트 또는 Source 링크가 보이게 한다.
2. 상세 화면에 Website, Source, Description/Profile, Candidate type을 보여준다.
3. 우즈베키스탄 자동차부품 검색 결과 중 최소 5개에는 실제 URL이 표시되게 한다.
4. 결과를 검증 완료 바이어처럼 표현하지 말고 “웹 기반 후보”로 표시한다.
```

---

## 5. 백엔드 수정 1: Web result URL 보존

`partners.service.ts`에서 Tavily/web search 결과를 `mappedWebResults`로 변환할 때 URL 필드를 넓게 수집한다.

현재 유사 코드:

```ts
website: item.url,
```

아래처럼 보강한다.

```ts
const sourceUrl =
  item.url ||
  item.link ||
  item.href ||
  item.sourceUrl ||
  item.source_url ||
  item.rawUrl ||
  item.raw_url ||
  item.metadata?.url ||
  item.metadata?.source ||
  '';
```

그리고 반환 객체에 모두 넣는다.

```ts
website: sourceUrl,
url: sourceUrl,
sourceUrl,
dataSource: 'Real-time web search',
```

반환 객체 예시:

```ts
return {
  _id: `web_${index}`,
  name: item.title,
  industry: 'Web Result',
  location: { country: targetCountry || 'Global', city: '' },
  country: targetCountry || 'Global',
  profileText: item.content || item.description || item.snippet || '',
  website: sourceUrl,
  url: sourceUrl,
  sourceUrl,
  dataSource: 'Real-time web search',
  tags: buildWebTags(item, detectedIntent),
  matchRecommendation: buildWebRecommendation(item, targetCountry, detectedIntent),
  matchAnalysis: buildWebAnalysis(item, targetCountry),
  score: Math.min(1.0, Math.max(0.1, score)),
};
```

---

## 6. 백엔드 수정 2: 우즈베키스탄 데모 URL 보강 fallback

오늘 발표 전 긴급 안정성을 위해, URL이 비어 있고 제목이 아래 패턴과 일치하면 실제 확인된 URL을 보강한다.

> 주의: 아래는 가짜 업체가 아니라 실제 검색 결과 페이지/공개 웹페이지 URL이다. 단, 검증 완료 바이어가 아니라 “웹 기반 후보 출처”로 표시한다.

```ts
function enrichUzbekistanDemoUrl(title = '') {
  const t = title.toLowerCase();

  if (t.includes('auto parts buyers') && t.includes('trademo')) {
    return 'https://www.trademo.com/uzbekistan/buyers/auto-parts';
  }

  if (t.includes('automobile spare parts supplies')) {
    return 'https://www.go4worldbusiness.com/buyers/uzbekistan/automobile-spare-parts-supplies.html';
  }

  if (t.includes('lusauto') || t.includes('auto parts wholesaler')) {
    return 'https://www.lusmall.com/WholesaleAutoParts?CountryCode=UZ';
  }

  if (t.includes('export genius') || t.includes('top 43 car auto parts importers')) {
    return 'https://www.exportgenius.in/uzbekistan-importers-of-car-auto-parts';
  }

  if (t.includes('volza') || t.includes('verified car parts buyers')) {
    return 'https://www.volza.com/p/car-parts/buyers/buyers-in-uzbekistan/';
  }

  if (t.includes('jtekt') || t.includes('uzbekistan distributor')) {
    return 'https://jtekt.ae/distributors-uzbekistan';
  }

  return '';
}
```

적용 방식:

```ts
let sourceUrl = extractSourceUrl(item);
if (!sourceUrl && (targetCountry || '').toLowerCase() === 'uzbekistan') {
  sourceUrl = enrichUzbekistanDemoUrl(item.title || item.name || '');
}
```

---

## 7. 백엔드 수정 3: 후보 설명과 태그 보강

웹 검색 결과가 단순히 `Web` 태그 하나만 갖고 있으면 발표 화면이 빈약하다. 아래 태그를 자동 보강한다.

### 태그 보강 규칙

제목/본문에 따라 태그를 추가한다.

```text
Uzbekistan 포함 → Uzbekistan
auto parts / car parts / spare parts → Auto Parts, Spare Parts
buyer / buyers / importer / importers → Buyer Candidate, Importer Candidate
wholesaler / distributor → Distributor Candidate
EV / electric vehicle → EV Parts
UzAuto / JTEKT / LUSAUTO → Named Source
Trademo / Volza / Export Genius / Go4WorldBusiness → Trade Data Source
```

결과 예시:

```ts
tags: ['Web Candidate', 'Uzbekistan', 'Auto Parts', 'Importer Candidate', 'Trade Data Source']
```

### 추천 문구 보강

기존:

```text
Discovered via real-time web search for buyer.
```

수정:

```text
Real-time web candidate for Uzbekistan automotive parts. This result should be verified through AX profile review, company website check, and local buyer validation.
```

한국어 UI라면:

```text
우즈베키스탄 자동차부품 관련 실시간 웹 기반 후보입니다. AX 프로필 검수, 웹사이트 확인, 현지 바이어 검증을 통해 추천 품질을 높여야 합니다.
```

---

## 8. 프론트엔드 수정 1: 카드에 웹사이트와 설명 표시

`CompanyResultCard.jsx`에서 다음을 보장한다.

### 현재 문제

카드에서 제목과 Global만 크게 보이고, 웹사이트/요약이 잘 보이지 않는다.

### 수정 방향

카드에 아래 정보를 표시한다.

```text
- 제목
- 국가/출처: Uzbekistan / Web Candidate
- 웹사이트 버튼: Website 또는 Source
- 1~2줄 설명(profileText)
- 태그 3~5개
- Match 점수
```

`website`가 있으면 제목 아래 또는 우측 상단에 반드시 표시한다.

```jsx
{website && (
  <a className="result-link" href={website} target="_blank" rel="noreferrer">
    Website / Source →
  </a>
)}
```

`profileText`가 있으면 카드 본문에 2줄 정도로 표시한다.

```jsx
{c.profileText && (
  <p className="result-summary">
    {c.profileText.length > 180 ? `${c.profileText.slice(0, 180)}...` : c.profileText}
  </p>
)}
```

---

## 9. 프론트엔드 수정 2: 상세 화면에 Source URL 무조건 표시

`PartnerSearch.jsx` 상세 모달에서 `detailWebsite` 계산을 강화한다.

현재:

```js
function extractWebsite(company = {}) {
  return company.website || company.url || company.site || company.domain || ''
}
```

아래처럼 확장한다.

```js
function extractWebsite(company = {}) {
  return (
    company.website ||
    company.url ||
    company.sourceUrl ||
    company.source_url ||
    company.link ||
    company.href ||
    company.site ||
    company.domain ||
    company.metadata?.url ||
    ''
  )
}
```

그리고 상세 모달에는 `detailWebsite`가 있으면 다음을 반드시 노출한다.

```text
Website / Source
https://...
```

`detailWebsite`가 없어도 web result라면 아래 문구를 보여준다.

```text
Source URL: Not provided by search provider. Verification required.
```

한국어:

```text
출처 URL: 검색 제공자 응답에 포함되지 않음. 별도 확인 필요.
```

---

## 10. 프론트엔드 수정 3: 상세 화면에 설명·후보유형 보강

상세 화면에 `profileText`를 명확히 표시한다.

추천 섹션:

```text
Candidate Summary
{profileText}
```

또는 한국어:

```text
후보 요약
{profileText}
```

또한 다음 표시를 넣는다.

```text
Candidate status: Web-based candidate / Verification required
```

한국어:

```text
후보 상태: 실시간 웹 기반 후보 / 검증 필요
```

이 문구는 오늘 발표에서 과장을 막으면서도 신뢰감을 준다.

---

## 11. 프론트엔드 수정 4: Location을 Global 대신 Uzbekistan으로 보정

검색어 또는 결과 제목/본문에 Uzbekistan이 있으면, web result의 location을 Uzbekistan으로 표시한다.

백엔드에서 `location.country = targetCountry`로 내려오면 가장 좋다.

프론트엔드에서도 방어적으로 처리한다.

```js
function inferCountry(company = {}) {
  const text = `${company.name || ''} ${company.profileText || ''} ${company.country || ''} ${company.location?.country || ''}`.toLowerCase()
  if (text.includes('uzbekistan')) return 'Uzbekistan'
  return company.country || company.location?.country || ''
}
```

상세 화면과 카드에서는 `Global`보다 `Uzbekistan`이 보이게 한다.

---

## 12. 발표용으로 반드시 보이면 좋은 5개 결과

검색어:

```text
Uzbekistan automotive EV parts buyer distributor importer
```

아래 중 최소 5개가 보이면 좋다.

```text
1. Auto Parts Buyers & Importers in Uzbekistan - Trademo
   https://www.trademo.com/uzbekistan/buyers/auto-parts

2. Automobile Spare Parts Supplies Buyers & Importers in Uzbekistan
   https://www.go4worldbusiness.com/buyers/uzbekistan/automobile-spare-parts-supplies.html

3. LUSAUTO Auto Parts - Uzbekistan Auto Parts Wholesaler
   https://www.lusmall.com/WholesaleAutoParts?CountryCode=UZ

4. List of Top 43 Car Auto Parts Importers in Uzbekistan - Export Genius
   https://www.exportgenius.in/uzbekistan-importers-of-car-auto-parts

5. Connect with Verified Car Parts Buyers in Uzbekistan - Volza
   https://www.volza.com/p/car-parts/buyers/buyers-in-uzbekistan/

6. Uzbekistan DISTRIBUTOR - JTEKT Sales Middle East
   https://jtekt.ae/distributors-uzbekistan
```

주의:

- 이들은 “검증 완료 바이어”가 아니라 공개 웹 기반 후보/출처다.
- Trademo, Volza, Export Genius는 실제 개별 바이어라기보다 무역 데이터 플랫폼의 바이어 리스트 페이지다.
- 발표에서는 “후보 리스트/출처”라고 설명한다.

---

## 13. 데모용 표시 문구

검색 결과 상단 또는 상세 화면에 아래 문구를 작게 넣을 수 있다.

영문:

```text
Real-time web candidate. Verification and AX profile enrichment required before final matching.
```

국문:

```text
실시간 웹 기반 후보입니다. 최종 매칭 전 AX 프로필 보강과 검증이 필요합니다.
```

---

## 14. 금지 사항

아래는 절대 하지 않는다.

```text
- 실제 존재하지 않는 업체 생성
- URL이 없는 결과에 가짜 업체 홈페이지 임의 생성
- 무역 데이터 플랫폼의 리스트 페이지를 개별 검증 바이어처럼 표현
- “검증 완료”, “확정 바이어”, “거래 가능성 보장” 표현 사용
```

허용되는 표현:

```text
- Web-based candidate
- Source page
- Buyer list source
- Verification required
- AX profile enrichment target
- 실시간 웹 기반 후보
- 출처 페이지
- 검증 필요 후보
```

---

## 15. 테스트 절차

작업 후 반드시 아래를 확인한다.

### API 테스트

```bash
curl "https://backend-production-601f2.up.railway.app/partners/search?limit=5&q=Uzbekistan%20automotive%20EV%20parts%20buyer%20distributor%20importer"
```

확인 항목:

```text
- data[0].website 또는 data[0].sourceUrl 값 존재
- profileText 존재
- location.country 또는 country가 Uzbekistan으로 표시
- tags에 Web Candidate, Uzbekistan, Auto Parts 등 표시
```

### 화면 테스트

```text
1. https://www.demostatra.com 접속
2. Uzbekistan automotive EV parts buyer distributor importer 검색
3. 결과 카드에 Website/Source 버튼이 보이는지 확인
4. 결과 카드에 요약문이 보이는지 확인
5. view_details 클릭
6. 상세 모달에 Website/Source URL이 보이는지 확인
7. Candidate Summary 또는 profileText가 보이는지 확인
8. 후보 상태가 “검증 필요”로 표시되는지 확인
```

---

## 16. 발표자용 설명 문구

수정 후 대표가 아래처럼 말할 수 있어야 한다.

```text
지금 보시는 결과는 DemoStatra가 우즈베키스탄 자동차부품 바이어 후보를 실시간 웹 기반으로 찾아온 화면입니다.

아직 검증 완료 DB는 아니기 때문에 개별 결과에는 Website 또는 Source 링크와 후보 요약을 함께 표시하고, AX 프로필 보강과 검증이 필요하다는 점을 명시했습니다.

이 후보 리스트를 바탕으로 향후 아인글로벌의 현지 네트워크와 검수 과정을 결합하면, 우즈베키스탄 19개 품목군별 적격 바이어 후보를 단계적으로 정교화할 수 있습니다.
```

---

## 17. 작업 완료 보고 형식

완료 후 아래 형식으로 보고한다.

```text
- 수정 파일 목록
- API 응답에서 website/sourceUrl 확인 여부
- 화면 카드에서 Website/Source 버튼 확인 여부
- 상세 화면에서 Website/Source, Candidate Summary 표시 여부
- 테스트 검색어
- 상위 5개 결과명 + URL
- 배포 여부
- 남은 리스크
```

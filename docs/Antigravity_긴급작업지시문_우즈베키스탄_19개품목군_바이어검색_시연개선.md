# Antigravity 긴급 작업지시문: 우즈베키스탄 19개 품목군 바이어 검색 시연 개선

## 1. 작업 배경

오늘 KOAA SHOW PoC 종료 발표회에서 (재)아인글로벌 대표와 담당자에게 DemoStatra 사이트의 B2B 바이어 검색 기능을 시연한다.

아인글로벌 대표와 담당자가 지난주 우즈베키스탄 출장을 다녀왔으므로, 발표 시연은 아래 방향이 가장 설득력 있다.

```text
우즈베키스탄 시장에서 19개 자동차부품·미래차·제조기술 품목군에 대해 바이어/수입업체/유통사를 검색하고, 결과를 바탕으로 AX DB 구축과 매칭 고도화 필요성을 설명한다.
```

현재 사이트에서 검색은 동작하지만, 성능이 완전히 안정적이지 않고 결과 품질이 들쭉날쭉하다. 따라서 오늘 발표 전까지 아래 항목을 긴급 보완한다.

---

## 2. 작업 대상

프로젝트 경로:

```text
D:/demostatra-project
```

우선 확인할 주요 파일:

```text
D:/demostatra-project/backend/src/modules/partners/partners.service.ts
D:/demostatra-project/backend/src/modules/partners/partners.controller.ts
D:/demostatra-project/frontend/src/**
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

## 3. 오늘 발표용 우선 목표

완전한 검색엔진 개편이 목표가 아니다. 오늘 목표는 아래 3가지다.

```text
1. 우즈베키스탄 자동차부품 바이어 검색 시 0건이 나오지 않게 한다.
2. 결과 상단에 자동차부품/EV/부품 수입·유통 관련성이 높은 결과가 나오게 한다.
3. 발표자가 “현재는 실시간 웹 검색 기반 후보 발굴이며, 향후 AX DB 구축으로 품질을 높인다”고 설명할 수 있게 한다.
```

---

## 4. 발표 시연용 추천 검색어

발표 현장에서 아래 검색어를 우선 사용한다.

### 1순위 검색어

```text
Uzbekistan automotive EV parts buyer distributor importer
```

실제 사이트 테스트 결과, 이 검색어는 비교적 좋은 결과를 반환한다.

확인된 결과 예시:

```text
- Auto Parts Buyers & Importers in Uzbekistan - Trademo
- Automobile Spare Parts Supplies Buyers & Importers in Uzbekistan
- List of Top 12 Automobile Parts Importers in Uzbekistan
- Uzbekistan DISTRIBUTOR | JTEKT Sales Middle East
- UzAuto-INZI 관련 결과
```

### 2순위 검색어

```text
Uzbekistan automobile spare parts importer buyer distributor
```

이 검색어도 비교적 안정적이다.

확인된 결과 예시:

```text
- Automobile Spare Parts Supplies Buyers & Importers
- FIRST-HAND CAR SPARE PARTS - A UNIQUE OFFER FOR WHOLESALE BUYERS | O'ZAVTOSANOAT AJ
- Uzbekistan Automobile Seat import Data
- List of Top 84 Auto Spare Parts Importers in Uzbekistan
- Automechanika Uzbekistan
```

### 3순위 검색어

```text
Uzbekistan automotive components buyers UzAuto INZI spare parts distributor
```

이 검색어는 UzAuto-INZI 등 구체 업체/산업 결과가 잘 나올 수 있다.

확인된 결과 예시:

```text
- JV UzAuto INZI LLC - Automobiles Importer in Uzbekistan
- Automobile Spare Parts Supplies Buyers & Importers
- Auto Parts Buyers & Importers in Uzbekistan
- FIRST-HAND CAR SPARE PARTS - A UNIQUE OFFER FOR WHOLESALE BUYERS
- UZAUTO-INZI. JV LTD in Tashkent
```

### 피해야 할 검색어

아래처럼 19개 품목군을 모두 한 번에 길게 넣으면 0건 또는 품질 저하가 발생할 수 있다.

```text
Uzbekistan buyers/importers for automotive parts: seat, auto molds, steering systems, pumps, valves, chassis, seat frame, special vehicles, brackets, bumpers, crash pad, aluminum die casting, gears, gearbox, LiDAR autonomous driving, EV battery equipment, smart factory
```

이 검색어는 너무 길고 품목이 많아 검색 의도가 분산된다. 오늘 발표에서는 사용하지 않는다.

---

## 5. 프론트엔드 긴급 개선: 시연용 Quick Search 버튼 추가

시간이 가능하면 메인 검색창 주변에 작은 quick search 버튼을 추가한다.

버튼 라벨:

```text
Uzbekistan Auto Parts Buyers
```

버튼 클릭 시 검색창에 아래 검색어를 넣고 바로 검색한다.

```text
Uzbekistan automotive EV parts buyer distributor importer
```

두 번째 버튼도 가능하면 추가한다.

버튼 라벨:

```text
Uzbekistan Spare Parts Importers
```

검색어:

```text
Uzbekistan automobile spare parts importer buyer distributor
```

주의:

- 이 기능은 “Demo shortcut” 또는 “Suggested search” 성격으로 보여야 한다.
- 결과를 조작하는 것이 아니라, 발표자가 좋은 검색어를 빠르게 입력할 수 있게 하는 기능이다.
- 레이아웃을 크게 바꾸지 말고 검색창 아래 작은 chip/button 형태로 배치한다.

---

## 6. 프론트엔드 필터 개선: Country 목록에 Uzbekistan 추가

현재 Country 필터에 Uzbekistan이 보이지 않을 수 있다. 아래 국가를 Country 필터에 추가한다.

```text
Uzbekistan
```

가능하면 함께 추가:

```text
Kazakhstan
Oman
UAE
Poland
Hungary
Czech Republic
Brazil
Chile
Panama
Kenya
Nigeria
Egypt
Morocco
Mexico
Canada
France
Spain
```

오늘 긴급 우선순위는 Uzbekistan이다.

---

## 7. 백엔드 검색어 최적화 개선

`partners.service.ts`에서 이미 `REGION_MAP`에는 우즈베키스탄이 있다.

```ts
{ kr: '우즈베키스탄', en: 'Uzbekistan' }
```

하지만 검색어가 길면 결과 품질이 떨어진다. 아래 개선을 적용한다.

### 7.1 우즈베키스탄 + 자동차부품 + 바이어 의도일 때 Tavily Query를 짧게 재작성

아래 조건에 해당하면 web search query를 강제로 짧게 만든다.

조건:

```text
- query에 Uzbekistan 또는 우즈베키스탄 포함
- query에 automotive/auto parts/car parts/spare parts/EV/자동차/부품 중 하나 포함
- query에 buyer/importer/distributor/바이어/수입업체/유통사 중 하나 포함
```

추천 Tavily query:

```text
Uzbekistan automobile spare parts importers distributors buyers
```

또는:

```text
Uzbekistan automotive parts buyers importers distributors UzAuto INZI spare parts
```

구현 의도:

- 19개 품목군을 모두 검색어에 넣지 않는다.
- 검색엔진에는 짧고 명확한 쿼리를 던진다.
- 화면 설명에서는 “19개 품목군을 기준으로 AX DB를 확장할 예정”이라고 말한다.

---

## 8. 결과 점수 보정 개선

검색 결과 제목/본문에 아래 키워드가 있으면 점수를 올린다.

### 강한 boost 키워드

```text
Uzbekistan
Automobile Parts
Auto Parts
Car Parts
Spare Parts
Importer
Importers
Buyer
Buyers
Distributor
Distributors
UzAuto
UzAuto-INZI
O'ZAVTOSANOAT
JTEKT
Automechanika Uzbekistan
```

### 낮춰야 할 키워드

```text
Used Cars
Auto Auction
Eurasianet
news
Facebook
general news
```

단, 너무 강한 필터링으로 0건이 나오지 않게 한다.

추천:

```text
- 관련 키워드는 boost
- 뉴스/중고차/경매는 penalty
- 그래도 5건 이하이면 penalty를 완화해 최소 결과 5건 확보
```

---

## 9. 발표용 AI Insight 문구 개선

우즈베키스탄 자동차부품 검색 결과의 AI Insight가 너무 단정적이면 안 된다. 아래처럼 방어적으로 바꾼다.

추천 문구:

```text
Uzbekistan shows potential demand for automotive parts, spare parts distribution, EV-related components, and local manufacturing partnerships. The current result is a real-time web-based shortlist and should be refined through AX profile construction, buyer verification, and local market validation.
```

한국어 버전이 가능하면:

```text
우즈베키스탄은 자동차부품, 예비부품 유통, EV 관련 부품, 현지 제조 파트너십 수요가 확인되는 시장입니다. 현재 결과는 실시간 웹 기반 후보 리스트이며, 향후 AX 프로필 구축과 바이어 검증을 통해 추천 품질을 높이는 구조입니다.
```

---

## 10. 19개 품목군 처리 방식

오늘 시연에서 19개 품목군을 모두 검색창에 넣지 않는다. 대신 화면 또는 발표 멘트에서 아래처럼 설명한다.

```text
오늘은 우즈베키스탄 자동차부품 바이어 후보 검색을 먼저 시연하고, 이후 AX DB 구축 단계에서 19개 품목군별로 검색·분류·검수 범위를 확장하겠습니다.
```

19개 품목군은 아래 묶음으로 설명한다.

```text
1. 차체·샤시·시트·브라켓
2. 금형·범퍼·기계부품
3. 특수·특장·복지차량
4. 미래차·전장·제조기술
```

세부 19개:

```text
시트
자동차 금형
포터블 TV
조향시스템, 펌프, 밸브
특수 차량
차량용 전장부품 (냉장고, LED 등)
차량용 샤시, 시트프레임
특장차량
자동차 브라켓 생산
탄소중립소재 제조
자동차 범퍼, 크래쉬 패드
자동차 차체용 부품, 알루미늄 다이캐스팅 제품
자동차 및 가전 금형
차체, 샤시, 브라켓 생산
기어, 기어박스, 기어펌프
특장, 복지차량 제조 및 부품제조
LIDAR 기반 자율주행 시스템 제조
2차전지 설비 제조
스마트팩토리 제조 업체
```

---

## 11. 데모 안정성 확보: 최소 5개 결과 보장

우즈베키스탄 자동차부품 바이어 검색에서 웹 검색 결과가 5개 미만이면, 아래 fallback query를 순차적으로 다시 시도한다.

```text
1. Uzbekistan automotive EV parts buyer distributor importer
2. Uzbekistan automobile spare parts importer buyer distributor
3. Uzbekistan automotive components buyers UzAuto INZI spare parts distributor
4. Uzbekistan car parts importers distributors
5. Uzbekistan Automechanika spare parts distributor
```

이 fallback은 오늘 발표용 안정성 확보 목적이다.

가능하면 debug에는 아래를 남긴다.

```json
{
  "demoFallbackUsed": true,
  "fallbackQuery": "..."
}
```

---

## 12. 데모용 결과를 조작하지 말 것

주의:

- 실제 존재하지 않는 회사를 만들어 넣지 않는다.
- 실제 웹 검색 결과가 아닌 가짜 결과를 “verified buyer”로 표시하지 않는다.
- AI가 생성한 리드는 반드시 “AI-sourced candidate” 또는 “candidate lead”로 표시한다.
- 발표 멘트도 “후보 리스트”라고 말한다.

권장 표현:

```text
실시간 웹 기반 후보 리스트
바이어 후보
검증 필요 후보
AX DB 구축 후 정밀 검수 대상
```

금지 표현:

```text
검증 완료 바이어
확정 바이어
거래 가능성 보장
수입업체 검증 완료
```

---

## 13. 발표자용 시연 순서

발표자는 아래 순서대로 시연할 수 있게 준비한다.

```text
1. https://www.demostatra.com 접속
2. 검색창에 아래 검색어 입력
   Uzbekistan automotive EV parts buyer distributor importer
3. 결과 5개 표시 확인
4. AI Insight 확인
5. 결과 중 Auto Parts Buyers/Importers, Spare Parts, UzAuto-INZI, JTEKT, Automechanika 관련 결과를 짚음
6. “현재는 웹 기반 후보 리스트이며, AX DB 구축과 검수로 품질을 높인다”고 설명
7. “아인글로벌의 우즈베키스탄 출장 이후, 이 시장을 19개 품목군 기준으로 우선 파일럿할 수 있다”고 연결
```

---

## 14. 발표자 멘트 초안

```text
아인글로벌에서 지난주 우즈베키스탄을 다녀오셨기 때문에, 오늘은 우즈베키스탄 자동차부품 바이어 후보를 예시로 검색해보겠습니다.

현재 DemoStatra는 실시간 웹 검색을 통해 우즈베키스탄의 자동차부품, 예비부품, EV 부품 관련 바이어·수입업체·유통사 후보를 찾아낼 수 있습니다.

다만 오늘 보시는 결과는 아직 검증 완료 DB가 아니라 후보 리스트입니다. 앞으로 AX DB를 구축하면 업체별 품목, 인증, 수요, 바이어 유형, 거래조건을 구조화하고, 담당자 검수를 거쳐 추천 품질을 높일 수 있습니다.

특히 우즈베키스탄 시장은 아인글로벌이 직접 현장 경험을 갖고 있기 때문에, 19개 품목군 중 우선순위 품목을 정해 2,000개사 AX 프로필 파일럿의 좋은 출발점으로 삼을 수 있습니다.
```

---

## 15. 검수 기준

작업 후 아래를 확인한다.

1. `Uzbekistan automotive EV parts buyer distributor importer` 검색 시 결과가 5개 내외로 나오는가?
2. 결과 상단에 auto parts, spare parts, importer, distributor, UzAuto, JTEKT, Automechanika 등 관련 결과가 보이는가?
3. 19개 품목군 전체를 검색창에 길게 넣지 않아도 시연 흐름이 자연스러운가?
4. Country 필터에 Uzbekistan이 추가되었는가? 가능하면 필터 선택 후 검색도 가능한가?
5. 결과가 0건일 때 fallback query가 동작하는가?
6. 가짜 업체를 생성하거나 검증 완료처럼 표현하지 않았는가?
7. AI Insight가 과장 없이 “후보 리스트 + AX DB로 보강 필요”를 설명하는가?
8. 배포 후 https://www.demostatra.com 에서 실제로 확인했는가?

---

## 16. 작업 완료 보고 형식

작업 완료 후 아래 형식으로 보고한다.

```text
- 수정 파일 목록
- 추가한 Quick Search 버튼 여부
- Country 필터 Uzbekistan 추가 여부
- 백엔드 query rewrite 적용 여부
- fallback query 적용 여부
- 테스트한 검색어
- 실제 반환 결과 상위 5개
- 배포 여부
- 남은 리스크
```

# Antigravity 작업지시문: 아인글로벌 DB 어카운트 개설 초보자 매뉴얼 최종화

## 1. 작업 배경

KOAA SHOW PoC 종료 간담회 후속조치로, 아인글로벌 담당자에게 DB 어카운트 개설 매뉴얼을 제공해야 한다.

아인글로벌 담당자들은 현재 엑셀 파일 기반 CRM 시스템에 익숙하며, MongoDB/PostgreSQL 같은 클라우드 DB 개념은 거의 모르는 상태로 가정한다.

따라서 개발자용 문서가 아니라, **비개발자 담당자가 계정 개설과 기본 보안 운영 흐름을 이해할 수 있는 초보자용 PDF 매뉴얼**이 필요하다.

---

## 2. 현재 생성된 파일

아래 파일을 기준으로 최종 보완한다.

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.html
```

현재 PDF도 생성되어 있다.

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.pdf
```

PDF 확인 결과:

```text
약 10페이지
약 737KB
텍스트 추출 정상
```

---

## 3. 최종 산출물

최종 산출물은 아래 2개다.

```text
1. 아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.html
2. 아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.pdf
```

가능하면 PDF 파일명은 담당자 전달용으로 아래 복사본도 만들어라.

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_담당자전달용.pdf
```

---

## 4. 문서의 기본 방향

문서는 아래 관점으로 작성/보완한다.

```text
DB = 엑셀의 확장판 / 온라인 데이터 창고
MongoDB = 회사별 AX 프로필처럼 구조가 조금씩 다른 데이터를 유연하게 담는 방식
PostgreSQL/Supabase = 엑셀처럼 표 구조로 관리하고 통계/대시보드에 강한 방식
```

아인글로벌 담당자가 개발자가 아니므로, 기술 용어는 반드시 쉬운 설명을 붙인다.

---

## 5. 반드시 포함할 내용

### 5.1 선택안 요약

두 가지 옵션을 명확히 보여준다.

```text
1안: MongoDB Atlas — 우선 추천
2안: PostgreSQL / Supabase — 대안
```

비교표에는 아래 항목을 포함한다.

```text
추천도
초기 AX 프로필 저장 적합성
엑셀 담당자 관점
사용 목적
이번 PoC 후속작업 적합도
```

핵심 결론은 아래 문구와 유사하게 유지한다.

```text
2,000개사 AX 프로필 초안 생성 단계에서는 MongoDB Atlas를 우선 사용하고,
향후 상담이력·통계·대시보드가 중요해지면 PostgreSQL/Supabase를 병행 검토합니다.
```

---

### 5.2 MongoDB Atlas 계정 개설 단계

MongoDB Atlas 섹션에는 비개발자가 따라할 수 있도록 다음 단계를 포함한다.

```text
1. https://www.mongodb.com/atlas 접속
2. Try Free 또는 Get Started 클릭
3. 아인글로벌 업무용 이메일로 가입
4. 이메일 인증
5. Organization 이름: AIN Global
6. Project 이름: DemoStatra AX DB Pilot
7. 무료 또는 최소 플랜 Cluster 생성
8. Cloud Provider/Region 선택
9. Cluster 이름: demostatra-ax-pilot
10. Database Access 메뉴에서 사용자 생성
11. Network Access 메뉴에서 접속 IP 설정
12. Database/Collection 구조 초안 확인
```

권장 DB 구조:

```text
Database: demostatra_ax_pilot
Collections:
- raw_directory_companies
- ax_profiles_draft
- ax_profiles_reviewed
- processing_logs
- reviewer_feedback
```

사용자 권한 예시:

```text
ain-admin: 관리자
demostatra-writer: 읽기/쓰기 제한
reviewer-readonly: 읽기 전용
```

---

### 5.3 PostgreSQL/Supabase 계정 개설 단계

PostgreSQL을 직접 설치하는 방식이 아니라, 비개발자가 쓸 수 있는 클라우드 PostgreSQL 서비스인 Supabase 기준으로 안내한다.

포함 단계:

```text
1. https://supabase.com 접속
2. Sign in / Start your project 클릭
3. 아인글로벌 업무용 이메일로 가입
4. 이메일 인증
5. Organization: AIN Global
6. New Project: DemoStatra AX DB Pilot
7. Database Password 설정 및 안전 보관
8. Region 선택
9. Table Editor에서 표 형태로 데이터 확인
```

권장 테이블:

```text
raw_directory_companies
ax_profiles_draft
ax_profiles_reviewed
reviewer_feedback
```

---

## 6. 반드시 강조할 보안 메시지

아래 내용은 눈에 띄게 표시한다.

```text
비밀번호/API Key/Connection String은 문서에 적지 않는다.
카카오톡이나 이메일 본문에 그대로 공유하지 않는다.
관리자 계정은 아인글로벌 내부 담당자가 보관한다.
외부 협력자에게는 제한 계정만 제공한다.
작업 종료 후 외부 작업자 계정 권한을 회수하거나 비밀번호를 변경한다.
```

---

## 7. 노하우 보호 관련 표현

문서에는 아래 지원 범위 구분을 포함한다.

### 제공 가능

```text
DB 계정개설 안내
입력 양식 제공
AX Profile 초안 생성
검수 체크리스트
결과 파일 제공
```

### 내부 노하우로 비공개

```text
Hermes 내부 설치·운영 전체 절차
자동화 스크립트 원본
프롬프트 체인
API Key
비용 최적화 로직
검색 실패 보정 로직
```

표현은 부드럽게 한다. “공개하지 않는다”보다 “담당자 운영 안정성을 위해 결과 확인과 검수 중심으로 안내한다”는 톤을 사용한다.

---

## 8. 디자인 요구사항

현재 HTML의 톤을 유지하되, PDF 전달용으로 보기 좋게 정리한다.

권장 스타일:

```text
- 표지: 파란 그라데이션 헤더
- 옵션 비교표: 명확한 색상 구분
- 주의사항: 주황색 박스
- 보안 경고: 빨간색 박스
- 권장 결론: 초록색 박스
- 단계별 절차: 번호 원형 아이콘
```

PDF 인쇄 시 페이지가 너무 이상하게 끊기지 않도록 아래 CSS를 유지/보강한다.

```css
@media print {
  .card, .step, .notice, .safe, .warn { break-inside: avoid; }
}
```

---

## 9. 주의할 표현

아래 표현은 피한다.

```text
MongoDB가 무조건 정답입니다.
PostgreSQL은 필요 없습니다.
담당자들이 직접 모든 것을 운영할 수 있습니다.
Hermes 설치법을 모두 공유합니다.
DemoStatra 자동화 노하우를 제공하겠습니다.
비용은 거의 들지 않습니다.
```

대신 아래 표현을 사용한다.

```text
초기 2,000개사 AX 프로필 초안 생성 단계에서는 MongoDB Atlas를 우선 추천합니다.
PostgreSQL/Supabase는 향후 표 기반 CRM, 상담이력, 통계·대시보드 단계에서 검토할 수 있습니다.
DemoStatra는 승인된 작업자 계정으로 AX 프로필 초안 생성과 데이터 구조화를 지원합니다.
1만개사 이상 확장은 처리량·검수량·운영비를 실측해 단계적으로 협의하는 것이 안전합니다.
```

---

## 10. PDF 생성 방법

Windows Git Bash 환경 기준으로 아래 명령을 사용할 수 있다.

```bash
HTML='D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.html'
PDF='D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.pdf'
'/c/Program Files/Google/Chrome/Application/chrome.exe' \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$PDF" "file:///$HTML"
```

생성 후 파일 크기와 페이지 수를 확인한다.

```bash
python - <<'PY'
from pathlib import Path
from pypdf import PdfReader
p=Path('D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.pdf')
print(p.exists(), round(p.stat().st_size/1024,1), 'KB')
r=PdfReader(str(p))
print('pages', len(r.pages))
PY
```

---

## 11. 최종 검수 기준

완료 전 아래를 확인한다.

```text
□ PDF가 정상 생성되었는가?
□ 첫 페이지 제목이 정확한가?
□ MongoDB Atlas가 1안/우선 추천으로 명확히 보이는가?
□ PostgreSQL/Supabase가 2안/대안으로 명확히 보이는가?
□ 엑셀 CRM에 익숙한 담당자도 이해할 수 있는 설명인가?
□ 비밀번호/API Key/Connection String 공유 금지 문구가 있는가?
□ 내부 노하우 보호 표현이 부드럽게 들어갔는가?
□ 2,000개사 파일럿과 1만개사 이후 예산 협의 메시지가 들어갔는가?
```

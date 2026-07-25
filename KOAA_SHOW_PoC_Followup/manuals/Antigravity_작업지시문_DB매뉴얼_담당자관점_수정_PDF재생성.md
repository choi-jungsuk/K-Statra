# Antigravity 작업지시문: 아인글로벌 DB 어카운트 개설 매뉴얼 표현 수정 및 PDF 재생성

## 1. 작업 배경

아래 문서는 아인글로벌 담당자에게 직접 전달할 **DB 어카운트 개설 매뉴얼**이다.

아인글로벌 담당자는 MongoDB/PostgreSQL을 잘 모르는 상태이며, 현재는 엑셀 기반 CRM 시스템으로 고객 데이터를 관리하는 데 익숙하다.

따라서 문서는 개발자나 외부 협력자 관점이 아니라, **아인글로벌 담당자가 직접 DB 어카운트를 개설하는 사용자 관점**으로 작성되어야 한다.

또한 아인글로벌은 DemoStatra가 아인글로벌 DB를 흡수하거나 Gran Oso AI 플랫폼으로 확장하려는 것 아니냐는 우려를 가진 적이 있다. 종료 간담회에서 기존 `demostatra.com`은 9월 기한 만료 후 연장하지 않고 폐기 예정이며, 대안으로 잠정 도메인 `www.ainglobal_manage.com`을 검토한다고 설명했다.

따라서 이 매뉴얼에서는 **DemoStatra 표현을 모두 제거하고 `ainglobal_manage` 중심으로 수정**해야 한다.

---

## 2. 작업 대상 파일

현재 원본 HTML:

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.html
```

현재 PDF:

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_초보자_매뉴얼_2026-07-04.pdf
```

수정 후 새 파일명으로 저장한다.

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.html
```

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.pdf
```

담당자 전달용 PDF 복사본도 생성한다.

```text
D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_담당자전달용.pdf
```

---

## 3. 수정 지시 1: 제목에서 “초보자” 삭제

현재 제목에 아래 표현이 있다.

```text
아인글로벌 DB 어카운트 개설 초보자 매뉴얼
```

수정:

```text
아인글로벌 DB 어카운트 개설 매뉴얼
```

HTML `<title>`, 표지 `<h1>`, footer, 파일명, PDF 제목에 모두 반영한다.

### 수정 이유

아인글로벌 담당자에게 전달되는 문서이므로 “초보자”라는 표현은 상대방이 불편하게 느낄 수 있다. 문서 내부에서도 “초보자용”이라는 표현은 쓰지 말고, 아래처럼 표현한다.

권장 표현:

```text
담당자용 매뉴얼
실무 담당자를 위한 쉬운 안내서
비개발자 담당자도 따라할 수 있는 단계별 안내
```

피해야 할 표현:

```text
초보자
초보자용
개발을 모르는 사람을 위한
```

---

## 4. 수정 지시 2: DemoStatra 표현을 ainglobal_manage로 교체

문서 안의 `DemoStatra` 표현은 모두 제거하고, 아래 기준으로 수정한다.

### 기본 교체 원칙

```text
DemoStatra → ainglobal_manage
DemoStatra AX DB Pilot → ainglobal_manage AX DB Pilot
demostatra-ax-pilot → ainglobal-manage-ax-pilot
demostatra_ax_pilot → ainglobal_manage_ax_pilot
demostatra-writer → ainglobal-writer
DemoStatra 작업자 → ainglobal_manage 작업자
DemoStatra/Gran Oso AI → ainglobal_manage 운영지원팀
```

### 표지 kicker 수정

현재 예:

```text
AIN Global × DemoStatra · DB Account Setup Manual
```

수정:

```text
AIN Global · ainglobal_manage · DB Account Setup Manual
```

### 프로젝트명 수정

MongoDB 프로젝트명:

```text
ainglobal_manage AX DB Pilot
```

MongoDB 클러스터명:

```text
ainglobal-manage-ax-pilot
```

MongoDB Database명:

```text
ainglobal_manage_ax_pilot
```

Supabase 프로젝트명:

```text
ainglobal_manage AX DB Pilot
```

### 도메인 언급 추가

문서 초반 또는 선택안 요약 아래에 짧게 아래 문구를 넣는다.

```text
본 매뉴얼은 아인글로벌이 직접 관리할 AX DB 운영 환경을 준비하기 위한 문서입니다. 서비스 명칭은 잠정적으로 ainglobal_manage를 사용하며, 검토 중인 도메인은 www.ainglobal_manage.com입니다.
```

단, 도메인은 아직 잠정이므로 “확정”으로 쓰지 말고 “잠정” 또는 “검토 중”으로 표현한다.

---

## 5. 수정 지시 3: “먼저 이해하기” 섹션을 엑셀 기반 CRM 시스템과 비교

현재 제목:

```text
0. 먼저 이해하기: DB는 엑셀의 확장판입니다
```

수정 제목:

```text
0. 먼저 이해하기: DB는 엑셀 기반 CRM 시스템의 확장판입니다
```

현재 카드가 `엑셀 / DB / AX DB` 구조라면, 아래처럼 수정한다.

### 카드 1: 현재 CRM

```text
현재 CRM
현재 사용 중인 CRM은 엑셀 기반으로 고객 데이터를 관리하기에 익숙하고 편리합니다. 다만 웹사이트 정보, AI 생성 AX 프로필, 담당자 검수 결과를 함께 누적하려면 별도의 온라인 데이터 저장소가 필요합니다.
```

### 카드 2: DB

```text
DB
DB는 CRM 뒤쪽에서 고객·업체 데이터를 안전하게 보관하는 온라인 데이터 창고입니다. 여러 사람이 승인된 권한으로 접속하고, 백업·접근권한·로그 관리가 가능합니다.
```

### 카드 3: AX DB

```text
AX DB
AX DB는 기존 CRM을 없애는 것이 아니라, CRM에 들어갈 기업 데이터를 더 풍부하게 만들어주는 보강 데이터입니다. 기업명, 웹사이트, 제품, 인증, 품목군, 상담 가능성, 검수 필요 항목을 AI가 읽기 좋게 구조화합니다.
```

### 중요한 톤

아인글로벌 담당자가 “이제 CRM 쓸 필요 없겠네”라고 말한 적이 있으므로, 문서는 아래 균형을 지켜야 한다.

```text
AX DB는 CRM을 대체한다고 단정하지 않는다.
AX DB는 CRM을 보강하고, AI 매칭에 필요한 기업정보를 구조화하는 역할이라고 설명한다.
```

피해야 할 표현:

```text
CRM을 대체합니다.
이제 CRM이 필요 없습니다.
기존 CRM보다 우월합니다.
```

권장 표현:

```text
CRM을 보강합니다.
CRM 뒤쪽의 데이터 저장소 역할을 합니다.
AI 매칭에 필요한 기업정보를 구조화합니다.
```

---

## 6. 수정 지시 4: 6항 입력 양식 표현 완화

현재 6항 제목:

```text
6. 아인글로벌 담당자에게 요청할 입력 양식
```

수정 제목:

```text
6. AX 프로필 생성을 위한 입력 양식
```

현재 설명:

```text
2,000개사 AX 프로필 생성을 위해 아래 항목을 엑셀로 제공해주시면 됩니다.
```

수정:

```text
2,000개사 AX 프로필 생성을 위해 엑셀 파일로 제공해주실 정보입니다. 업체명과 웹사이트 주소는 필수이며, 나머지 항목은 있으면 분류와 검수 품질을 높이는 데 도움이 됩니다.
```

### 입력 필드 표 수정

필수는 아래 두 개만 명확히 한다.

```text
company_name: 필수
website: 필수
```

나머지는 아래처럼 표현한다.

```text
country: 있으면 좋음
product_group: 있으면 좋음
target_region: 선택
company_type_hint: 선택
priority: 선택
memo: 선택
```

표 하단에 아래 문구를 추가한다.

```text
업체명과 웹사이트 주소만 있어도 1차 AX 프로필 초안 생성은 가능합니다. 다만 국가, 품목군, 우선순위가 함께 제공되면 분류 정확도와 담당자 검수 효율이 높아집니다.
```

---

## 7. 수정 지시 5: 8항 삭제

현재 8항은 아래 내용을 포함한다.

```text
8. DemoStatra/Gran Oso AI 지원 범위
지원 가능 / 지원하지 않는 내부 노하우
권장 운영 문구
```

이 부분은 담당자 제공용 설치 매뉴얼과 직접 관련이 없고, “지원하지 않는 내부 노하우”라는 표현이 아인글로벌 담당자에게 방어적으로 보일 수 있다.

따라서 8항 전체를 삭제한다.

삭제 대상:

```text
<h2>8. ... 지원 범위</h2>
지원 가능 / 지원하지 않는 내부 노하우 표
권장 운영 문구 박스
```

삭제 후 문서는 7항 보안 주의사항에서 마무리한다.

Footer는 아래처럼 자연스럽게 수정한다.

```text
작성일: 2026-07-04 · 문서 성격: 아인글로벌 담당자 제공용 DB 어카운트 개설 매뉴얼 · 민감정보/비밀번호/API Key 미포함
```

---

## 8. 최종 문서 구조

수정 후 문서 구조는 아래와 같아야 한다.

```text
표지
0. 먼저 이해하기: DB는 엑셀 기반 CRM 시스템의 확장판입니다
1. 두 가지 선택안 요약
2. 계정 개설 전 준비물
3. 1안: MongoDB Atlas 계정 개설 — 우선 추천
4. 2안: PostgreSQL / Supabase 계정 개설 — 대안
5. 담당자용 최종 선택 가이드
6. AX 프로필 생성을 위한 입력 양식
7. 보안 주의사항
```

8항은 없어야 한다.

---

## 9. PDF 생성 명령

HTML 수정 후 PDF를 다시 생성한다.

Windows Git Bash 기준:

```bash
HTML='D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.html'
PDF='D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.pdf'
'/c/Program Files/Google/Chrome/Application/chrome.exe' \
  --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$PDF" "file:///$HTML"

cp -f "$PDF" \
  'D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_담당자전달용.pdf'
```

---

## 10. 최종 검수 명령

아래 검색 결과가 0이어야 한다.

```bash
grep -n "초보자\|DemoStatra\|지원하지 않는 내부 노하우\|권장 운영 문구\|CRM을 대체\|CRM이 필요 없" \
  'D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.html'
```

아래 검색어는 존재해야 한다.

```bash
grep -n "ainglobal_manage\|www.ainglobal_manage.com\|엑셀 기반 CRM\|업체명과 웹사이트 주소는 필수\|CRM을 보강" \
  'D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_2026-07-04.html'
```

PDF 파일 확인:

```bash
python - <<'PY'
from pathlib import Path
from pypdf import PdfReader
p=Path('D:/demostatra-project/KOAA_SHOW_PoC_Followup/manuals/아인글로벌_DB_어카운트_개설_매뉴얼_담당자전달용.pdf')
print('exists:', p.exists())
print('size_kb:', round(p.stat().st_size/1024,1) if p.exists() else None)
r=PdfReader(str(p))
print('pages:', len(r.pages))
text='\n'.join((page.extract_text() or '') for page in r.pages)
for bad in ['초보자','DemoStatra','지원하지 않는 내부 노하우','권장 운영 문구']:
    print(bad, bad in text)
PY
```

---

## 11. 완료 기준

작업 완료 조건:

```text
□ 제목에서 “초보자” 삭제
□ 모든 DemoStatra 표현 제거
□ ainglobal_manage 및 잠정 도메인 표현 반영
□ 엑셀 기반 CRM 시스템과 비교하는 설명으로 수정
□ 입력 양식에서 업체명/웹사이트만 필수로 표시
□ 8항 지원범위/내부노하우/권장문구 삭제
□ 담당자 관점의 자연스러운 PDF 생성
□ 담당자전달용 PDF 파일 생성
```

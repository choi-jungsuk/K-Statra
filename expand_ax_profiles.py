import os
import json
import sys
import argparse
import time
import re
import requests

# 1. .env 파일 파싱 기능 (dotenv 패키지가 없어도 실행 가능하도록 수동 파싱 적용)
def load_env_variables(env_path):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                key, val = line.split('=', 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                env_vars[key] = val
    return env_vars

# 파일 이름 유효성 검사 (특수문자 제거)
def clean_filename(filename):
    return re.sub(r'[\x00-\x1f\\/*?:"<>|]', '_', filename).strip()

# 2. Tavily Search API 호출 함수
def search_tavily(company_name, website, api_key):
    if not api_key:
        print("[Warning] TAVILY_API_KEY가 없습니다. 웹 검색 없이 기본 정보로 진행합니다.")
        return None

    # Tavily 검색 쿼리 구성
    query = f'"{company_name}" "{website}" B2B OR 회사소개 OR 제품소개 OR automotive parts'
    print(f" -> [Tavily] '{company_name}' 검색 실행 중...")
    
    url = "https://api.tavily.com/search"
    headers = {"Content-Type": "application/json"}
    payload = {
        "api_key": api_key,
        "query": query,
        "search_depth": "basic",
        "include_answer": True,
        "max_results": 3
    }
    
    for attempt in range(3):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=20)
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                print(f" -> [Tavily 429] Rate Limit 발생. {5 * (attempt + 1)}초 대기 후 재시도...")
                time.sleep(5 * (attempt + 1))
            else:
                print(f" -> [Tavily Error] HTTP {response.status_code}: {response.text}")
                break
        except Exception as e:
            print(f" -> [Tavily Exception] {e}. {3 * (attempt + 1)}초 대기 후 재시도...")
            time.sleep(3 * (attempt + 1))
    return None

# 3. OpenAI GPT-4o API 호출 함수
def call_gpt4o(system_prompt, user_prompt, api_key):
    if not api_key:
        print("[Error] OPENAI_API_KEY가 존재하지 않습니다.")
        return None
        
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2
    }
    
    for attempt in range(3):
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=90)
            if response.status_code == 200:
                res_json = response.json()
                return res_json['choices'][0]['message']['content']
            elif response.status_code == 429:
                print(f" -> [GPT-4o 429] Rate Limit 발생. {10 * (attempt + 1)}초 대기 후 재시도...")
                time.sleep(10 * (attempt + 1))
            else:
                print(f" -> [GPT-4o Error] HTTP {response.status_code}: {response.text}")
                time.sleep(5)
        except Exception as e:
            print(f" -> [GPT-4o Exception] {e}. {5 * (attempt + 1)}초 대기 후 재시도...")
            time.sleep(5 * (attempt + 1))
    return None

# 4. JSON 문자열에서 JSON 부분만 추출하는 유틸리티
def extract_json_from_text(text):
    match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except:
            pass
    # 백틱 없이 생짜 JSON인 경우 시도
    try:
        return json.loads(text.strip())
    except:
        return None

# 5. 메인 실행 함수
def main():
    parser = argparse.ArgumentParser(description="100개 국내 업체 AX 프로필 상세화 확장 스크립트")
    parser.add_argument("--limit", type=int, default=None, help="처리할 최대 업체 수 (테스트 용도)")
    parser.add_argument("--test", action="store_true", help="1개사 파일 테스트 모드")
    args = parser.parse_args()

    # 경로 구성
    project_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(project_dir, ".env")
    env_vars = load_env_variables(env_path)
    
    openai_key = env_vars.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
    tavily_key = env_vars.get("TAVILY_API_KEY") or os.environ.get("TAVILY_API_KEY")
    
    if not openai_key:
        print("[Error] OpenAI API 키를 .env 파일 또는 환경 변수에서 찾을 수 없습니다. 실행을 중단합니다.")
        sys.exit(1)

    domestic_dir = r"D:\AXData-Engineering\KOAA_SHOW_AX_2000\domestic_100"
    json_source_path = os.path.join(domestic_dir, "KOAA_업체_AX프로필_100개사_완료.json")
    
    # 만약 위 파일명이 깨졌거나 없을 때 다른 명칭 찾아보기
    if not os.path.exists(json_source_path):
        print(f"[Info] 기본 파일 경로가 존재하지 않습니다: {json_source_path}")
        # KOAA로 시작하고 .json으로 끝나는 파일 검색
        candidates = [f for f in os.listdir(domestic_dir) if f.startswith("KOAA") and f.endswith(".json")]
        if candidates:
            json_source_path = os.path.join(domestic_dir, candidates[0])
            print(f"[Info] 대체 파일을 사용합니다: {json_source_path}")
        else:
            print(f"[Error] 소스 JSON 파일을 찾을 수 없습니다.")
            sys.exit(1)

    # 출력 폴더 설정
    markdown_out_dir = os.path.join(domestic_dir, "markdown_profiles")
    json_out_dir = os.path.join(domestic_dir, "json_profiles")
    os.makedirs(markdown_out_dir, exist_ok=True)
    os.makedirs(json_out_dir, exist_ok=True)

    print(f" -> 데이터 소스: {json_source_path}")
    print(f" -> 마크다운 출력: {markdown_out_dir}")
    print(f" -> JSON 출력: {json_out_dir}")

    # 데이터 로드
    with open(json_source_path, 'r', encoding='utf-8') as f:
        companies = json.load(f)

    if args.test:
        companies = companies[:1]
        print(f"[Test Mode] 1개사 테스트 모드로 동작합니다. 대상: {companies[0].get('company_name')}")
    elif args.limit:
        companies = companies[:args.limit]
        print(f"[Limit Mode] 지정된 {args.limit}개사만 처리합니다.")

    print(f" -> 총 처리 대상 업체 수: {len(companies)}")

    # GPT System Prompt
    system_prompt = """당신은 B2B 매칭 플랫폼인 demostatra의 AX 데이터 가공 전문가입니다.
주어진 국내 업체의 기본 요약 정보와 웹 검색 데이터(Tavily 수집자료)를 분석하여, 예시 포맷(MAS_MOTORES 예시)과 완벽하게 동일한 구조의 고품질 상세 보고서 및 JSON 데이터를 생성해야 합니다.

반드시 다음 14개 섹션을 엄격하게 준수하여 마크다운 파일 내용 전체를 완성하세요.
구조 가이드라인:
1. # AX DB 샘플 프로필: [회사명]
   - 작성일: 2026-07-17
   - 대상 웹사이트: [URL]
   - 데이터 성격: 공개 웹사이트 기반 AX DB 초안
   - 검증 상태: 자동 수집·정리 초안 / 담당자 검수 필요
   - 활용 목적: KOAA SHOW PoC - 상세 확장 버전
   - 시장 분류: [분류 정보]
2. ## 1. 기업 기본정보 (마크다운 표 형식, 이메일, 전화, 주소, 설립년도, SNS, 품목 등 채우기)
3. ## 2. 기업 요약 (긴 줄글 형태의 회사 배경, 특징 설명)
4. ## 3. AX 분류 (마크다운 표 형식: AX 기업유형, B2B 역할, 한국 브랜드 연관성 등 상세 매핑)
5. ## 4. 주요 제품 및 취급 브랜드
   - 4.1 제품 카테고리 (마크다운 표 형식)
   - 4.2 취급 차량 브랜드 또는 강점 기술 분야 (마크다운 표 형식)
6. ## 5. 디지털·비즈니스 역량 (E-Commerce, 재고, 배송, 검색, SNS 등 분석 표 형식)
7. ## 6. 기업 미션·비전 (회사가 추구하는 방향성 기술)
8. ## 7. KOAA SHOW 매칭 관점 해석
   - 7.1 적합한 해외 바이어/한국 기업 유형
   - 7.2 예상 상담 주제 (마크다운 표 형식)
9. ## 8. 추천 태그 (마크다운 코드블록 형태로 태그 나열)
10. ## 9. 매칭 점수 초안 (평가 항목별 상세 점수 및 종합 초안 판단)
11. ## 10. AX DB용 JSON 초안 (```json ... ``` 코드 블록 내에 JSON 포맷 삽입. JSON 내부에는 아래의 필드가 명시되어야 합니다:
    company_name, brand_name, country, region, website, email, phone, key_contacts, founded, industry, main_products, business_model, ax_tags, ax_score_draft(상세 점수 오브젝트))
12. ## 11. 수기 검수 필요 항목 (대학생 아르바이트생이 해당 기업 홈페이지를 직접 보며 1분 이내에 O/X로 체크할 수 있는 현실적인 다음 6가지 항목으로 내용을 고정하여 출력하세요:
    1) 홈페이지 정상 접속 여부 (O/X)
    2) 대표 이메일 정상 작동 여부 (발송 테스트 시 반송 여부 확인 필요) (O/X)
    3) 대표 전화번호 기재 여부 및 통화 유효성 (O/X)
    4) 당사 추출 주요 제품군이 홈페이지 제품 소개 페이지에 실제로 존재하는지 여부 (O/X)
    5) 공지사항이나 연혁 등에 최근 1~2년 내 업데이트 흔적이 존재하는지 여부 (O/X)
    6) 홈페이지 내 소셜 미디어(유튜브, 블로그 등) 링크가 정상 작동하는지 여부 (O/X))
13. ## 12. 요약 한 문장 (한 줄 요약 코드블록)
14. ## 13. 출처 (웹사이트 및 서브페이지 URL 리스트)
15. ## 14. 주의 (공개 웹사이트 기반이므로 검증 필요하다는 면책 문구)

출력 언어: 한국어.
답변은 오직 마크다운 형식으로 작성하며, 인사말이나 부연설명 없이 바로 '# AX DB 샘플 프로필: ...'으로 시작하세요."""

    success_count = 0
    skip_count = 0
    fail_count = 0

    for company in companies:
        order = company.get("source_order", 0)
        name = company.get("company_name", "").strip()
        website = company.get("website", "").strip()
        
        if not name:
            continue
            
        safe_name = clean_filename(name)
        md_filename = f"{order}_{safe_name}_AX_Profile.md"
        json_filename = f"{order}_{safe_name}_AX_Profile.json"
        
        md_filepath = os.path.join(markdown_out_dir, md_filename)
        json_filepath = os.path.join(json_out_dir, json_filename)
        
        # 6. Resume 기능: 파일이 존재하면 스킵
        if os.path.exists(md_filepath) and os.path.exists(json_filepath):
            print(f"[{order}/100] '{name}' 상세 프로필 파일이 이미 존재합니다. 스킵합니다.")
            skip_count += 1
            continue
            
        print(f"[{order}/100] '{name}' 작업 시작... (웹사이트: {website})")
        
        # Tavily 검색 수행
        search_data = None
        if website and website != "홈페이지 없음" and not website.startswith("N/A"):
            search_data = search_tavily(name, website, tavily_key)
            
        # Tavily 검색 컨텐츠 추출
        search_content = ""
        if search_data:
            search_content += f"[Tavily AI Answer Summary]\n{search_data.get('answer', 'N/A')}\n\n"
            search_content += "[Tavily Web Search Results]\n"
            for res in search_data.get("results", []):
                search_content += f"- Title: {res.get('title')}\n  URL: {res.get('url')}\n  Snippet: {res.get('content')}\n\n"
        else:
            search_content = "Tavily 검색 데이터가 없거나 수집에 실패했습니다."

        # User Prompt 구성
        user_prompt = f"""다음은 확장할 업체의 1페이지 요약 및 수집된 추가 리서치 데이터입니다.

[기존 1페이지 데이터 (JSON)]
{json.dumps(company, ensure_ascii=False, indent=2)}

[추가 웹 리서치 정보]
{search_content}

위 자료를 기반으로 MAS MOTORES 예시처럼 풍부하게 내용을 확장하여 서너 페이지 분량의 Markdown 프로필을 작성해 주세요. 
특히 기업 요약, 매칭 관점 해석, 취급 제품, 비즈니스 역량 부분을 자세히 분석하여 채워 넣어주세요."""

        # GPT-4o 호출
        print(f" -> [GPT-4o] 상세 프로필 생성 요청 중...")
        profile_content = call_gpt4o(system_prompt, user_prompt, openai_key)
        
        if not profile_content:
            print(f"[Error] [{order}/100] '{name}' 상세 프로필 생성에 실패했습니다.")
            fail_count += 1
            continue
            
        # 마크다운 저장
        with open(md_filepath, 'w', encoding='utf-8') as f_out:
            f_out.write(profile_content)
            
        # 마크다운 내부에서 JSON 추출하여 개별 JSON 저장
        extracted_json = extract_json_from_text(profile_content)
        if extracted_json:
            # 원천 데이터 메타데이터 보강
            extracted_json["source_order"] = order
            extracted_json["original_source_group"] = company.get("source_group")
            with open(json_filepath, 'w', encoding='utf-8') as j_out:
                json.dump(extracted_json, j_out, ensure_ascii=False, indent=2)
        else:
            # 파싱 실패 시 예비용 기본 구조 저장
            print(f" -> [Warning] [{order}/100] '{name}' 마크다운 내 JSON 파싱 실패. 요약본 메타데이터 기반 예비 JSON 저장.")
            fallback_json = {
                "company_name": name,
                "website": website,
                "source_order": order,
                "error": "JSON block parsing failed from LLM content",
                "quality_grade": company.get("quality_grade", "B")
            }
            with open(json_filepath, 'w', encoding='utf-8') as j_out:
                json.dump(fallback_json, j_out, ensure_ascii=False, indent=2)
                
        print(f" -> [Success] '{name}' 상세 프로필 및 JSON 저장 완료.")
        success_count += 1
        
        # API Rate Limit 안전 장치 (1초 딜레이)
        time.sleep(1)

    print("\n========================================")
    print("AX 프로필 확장 작업 완료 리포트")
    print(f" - 성공: {success_count} 건")
    print(f" - 스킵 (이미 존재): {skip_count} 건")
    print(f" - 실패: {fail_count} 건")
    print("========================================")

if __name__ == "__main__":
    main()

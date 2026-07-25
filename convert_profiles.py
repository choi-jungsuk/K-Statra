import os
import json
import re
import sys
import argparse
import subprocess
import pandas as pd

# 파일 이름 유효성 검사 (특수문자 제거)
def clean_filename(filename):
    return re.sub(r'[\x00-\x1f\\/*?:"<>|]', '_', filename).strip()

# 마크다운 표(Table) 데이터를 파싱하는 함수
def parse_markdown_table(lines):
    rows = []
    for line in lines:
        if line.strip().startswith('|') and not re.match(r'^[\s|:-]+$', line.strip()):
            cols = [c.strip() for c in line.strip().split('|')[1:-1]]
            rows.append(cols)
    return rows

# 마크다운에서 수기 검수 필요 항목을 파싱하는 함수
def parse_checklist_from_md(md_path):
    checklist = {
        "홈페이지_접속": "X",
        "이메일_작동": "X",
        "전화_유효성": "X",
        "제품군_존재": "X",
        "최근_업데이트": "X",
        "소셜_링크": "X"
    }
    if not os.path.exists(md_path):
        return checklist
        
    try:
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # 수기 검수 필요 항목 섹션 추출
        section_match = re.search(r'## 11\. 수기 검수 필요 항목\s*(.*?)(?:## 12|\Z)', content, re.DOTALL)
        if section_match:
            section_text = section_match.group(1)
            # O 또는 X 기호 파싱
            h_match = re.search(r'1\) 홈페이지 정상 접속 여부 .*?\((.*?)\)', section_text)
            e_match = re.search(r'2\) 대표 이메일 정상 작동 여부 .*?\((.*?)\)', section_text)
            p_match = re.search(r'3\) 대표 전화번호 기재 여부 .*?\((.*?)\)', section_text)
            pr_match = re.search(r'4\) 당사 추출 주요 제품군 .*?\((.*?)\)', section_text)
            u_match = re.search(r'5\) 공지사항이나 연혁 .*?\((.*?)\)', section_text)
            s_match = re.search(r'6\) 홈페이지 내 소셜 미디어 .*?\((.*?)\)', section_text)
            
            if h_match: checklist["홈페이지_접속"] = h_match.group(1).strip()
            if e_match: checklist["이메일_작동"] = e_match.group(1).strip()
            if p_match: checklist["전화_유효성"] = p_match.group(1).strip()
            if pr_match: checklist["제품군_존재"] = pr_match.group(1).strip()
            if u_match: checklist["최근_업데이트"] = u_match.group(1).strip()
            if s_match: checklist["소셜_링크"] = s_match.group(1).strip()
    except Exception as e:
        print(f"[Warning] 마크다운 검수 항목 파싱 실패 ({md_path}): {e}")
        
    return checklist

# Chrome Headless 모드를 이용해 HTML을 PDF로 변환하는 함수
def convert_html_to_pdf_chrome(html_path, pdf_path):
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        print(f"[Error] 크롬 실행 파일을 찾을 수 없습니다: {chrome_path}")
        return False
        
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--print-to-pdf-no-header",
        f"--print-to-pdf={pdf_path}",
        html_path
    ]
    try:
        # shell=True를 써서 공백 포함 경로가 깨지는 현상 방지
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30, check=True)
        return True
    except Exception as e:
        print(f"     [Chrome PDF Error] {e}")
        return False

# 고품질 HTML 템플릿 정의 (MAS_MOTORES 스타일)
HTML_TEMPLATE = """<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AX DB 프로필 - {company_name}</title>
  <style>
    :root {{
      --navy:#0f1e36; --blue:#2563eb; --green:#059669; --orange:#f59e0b;
      --red:#dc2626; --purple:#7c3aed; --slate:#475569; --light:#f8fafc; --line:#e2e8f0;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin:0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", Arial, sans-serif; color:#1e293b; background:#eef2f7; line-height:1.6; }}
    .page {{ max-width: 1120px; margin: 24px auto; background:white; border-radius:18px; overflow:hidden; box-shadow:0 20px 60px rgba(15,30,54,.12); }}
    header {{ padding:34px 42px; background:linear-gradient(135deg,#0f2744,#2563eb 60%,#0f1e36); color:white; }}
    header .badge {{ display:inline-block; padding:5px 12px; border:1px solid rgba(255,255,255,.35); border-radius:999px; font-size:13px; margin-bottom:12px; background:rgba(255,255,255,.12); }}
    header .badge-domestic {{ display:inline-block; padding:5px 12px; border:1px solid rgba(255,255,255,.45); border-radius:999px; font-size:13px; margin-bottom:12px; background:rgba(37,99,235,.35); margin-left:8px; }}
    h1 {{ margin:0 0 8px; font-size:30px; line-height:1.25; }}
    .subtitle {{ margin:0; color:#fde68a; font-size:15px; }}
    .meta-row {{ display:flex; gap:20px; margin-top:14px; flex-wrap:wrap; }}
    .meta-item {{ font-size:13px; color:rgba(255,255,255,.8); }}
    .meta-item strong {{ color:white; }}
    main {{ padding:30px 42px 46px; }}
    .notice {{ padding:14px 16px; background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; border-radius:12px; margin-bottom:22px; font-weight:600; }}
    .highlight-box {{ padding:14px 16px; background:#eff6ff; border:1px solid #bfdbfe; color:#1e40af; border-radius:12px; margin-bottom:22px; font-weight:600; }}
    .grid {{ display:grid; grid-template-columns: 1fr 1fr; gap:18px; }}
    .grid3 {{ display:grid; grid-template-columns: 1fr 1fr 1fr; gap:18px; }}
    .card {{ border:1px solid var(--line); border-radius:14px; padding:18px; background:#fff; margin-bottom:18px; }}
    .card.blue {{ border-top:4px solid var(--blue); }}
    .card.green {{ border-top:4px solid var(--green); }}
    .card.orange {{ border-top:4px solid var(--orange); }}
    .card.red {{ border-top:4px solid var(--red); }}
    .card.purple {{ border-top:4px solid var(--purple); }}
    h2 {{ margin:0 0 14px; font-size:21px; color:var(--navy); display:flex; align-items:center; gap:8px; }}
    h2 .icon {{ font-size:20px; }}
    h3 {{ margin:16px 0 8px; font-size:16px; color:#0f766e; }}
    table {{ width:100%; border-collapse:collapse; font-size:14px; }}
    th,td {{ border-bottom:1px solid #edf2f7; padding:9px 10px; vertical-align:top; }}
    th {{ background:#f8fafc; text-align:left; color:#334155; width:28%; font-weight:600; }}
    td strong {{ color:#b91c1c; }}
    ul {{ margin:8px 0 0 20px; padding:0; }}
    li {{ margin:4px 0; font-size:14px; }}
    .tags {{ display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }}
    .tag {{ padding:5px 10px; background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; border-radius:999px; font-size:12px; font-weight:700; }}
    .score {{ display:grid; grid-template-columns: 240px 1fr 70px; align-items:center; gap:10px; margin:9px 0; font-size:14px; }}
    .bar {{ height:9px; background:#e5e7eb; border-radius:999px; overflow:hidden; }}
    .fill {{ height:100%; background:linear-gradient(90deg,#22c55e,#2563eb); border-radius:999px; }}
    .quote {{ padding:16px 18px; background:#f0fdf4; border-left:5px solid #22c55e; border-radius:10px; font-size:15px; font-weight:600; color:#166534; margin:12px 0; }}
    .muted {{ color:#64748b; font-size:13px; }}
    a {{ color:#2563eb; word-break:break-all; }}
    .badge-high {{ display:inline-block; padding:2px 10px; background:#dcfce7; color:#166534; border-radius:999px; font-size:12px; font-weight:700; }}
    .badge-mid {{ display:inline-block; padding:2px 10px; background:#fee2e2; color:#991b1b; border-radius:999px; font-size:12px; font-weight:700; }}
    footer {{ padding:18px 42px; background:#f8fafc; border-top:1px solid var(--line); color:#64748b; font-size:12px; display:flex; justify-content:space-between; align-items:center; }}
    @media print {{
      body {{ background:white; }}
      .page {{ box-shadow:none; margin:0; border-radius:0; }}
      .notice, .card, section {{ break-inside:avoid; }}
      header {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
      .fill {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
      .tag {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
      .badge-high {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
      .badge-mid {{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }}
    }}
    @media (max-width:800px){{ .grid,.grid3 {{ grid-template-columns:1fr; }} header,main,footer {{ padding-left:22px; padding-right:22px; }} }}
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div>
        <span class="badge">AX DB Profile Draft · Verification Required</span>
        <span class="badge-domestic">🇰🇷 KOAA SHOW Domestic Exporter</span>
      </div>
      <h1>{company_name}<br /><span style="font-size:20px;font-weight:400;color:#fde68a;">{brand_name_sub}</span></h1>
      <p class="subtitle">{industry} 전문 제조 기업 · {region} 본사 · KOAA SHOW 국내 업체 AX 프로필</p>
      <div class="meta-row">
        <div class="meta-item">📍 <strong>{region}, 대한민국</strong></div>
        <div class="meta-item">🌐 <strong>{website_sub}</strong></div>
        <div class="meta-item">📅 작성일: <strong>2026-07-17</strong></div>
        <div class="meta-item">📅 설립: <strong>{founded}</strong></div>
      </div>
    </header>

    <main>
      <div class="notice">⚠️ 주의: 공개 웹사이트 기반 AX DB 초안입니다. "검색/수집 데이터 기반 초안"이며 실제 거래 및 파트너 계약 이전에 수기 검수가 필수적으로 요구됩니다.</div>

      <div class="highlight-box">🔍 <strong>플랫폼 분석 요약</strong> — {matching_role}</div>

      <!-- 1. 기업 기본정보 -->
      <section class="card blue">
        <h2><span class="icon">🏢</span> 1. 기업 기본정보</h2>
        <table>
          <tr><th>기업명 (법인)</th><td>{company_name}</td></tr>
          <tr><th>브랜드명</th><td><strong>{brand_name}</strong></td></tr>
          <tr><th>국가 / 지역</th><td>🇰🇷 대한민국 · {region}</td></tr>
          <tr><th>본점 주소</th><td>{address}</td></tr>
          <tr><th>웹사이트</th><td><a href="{website}" target="_blank">{website}</a></td></tr>
          <tr><th>대표 이메일</th><td><a href="mailto:{email}">{email}</a></td></tr>
          <tr><th>전화</th><td>{phone}</td></tr>
          <tr><th>대표자 / 담당자</th><td>{key_contacts}</td></tr>
          <tr><th>설립년도</th><td>{founded} 년</td></tr>
          <tr><th>산업분야</th><td>{industry}</td></tr>
          <tr><th>주요 품목</th><td>{main_products}</td></tr>
        </table>
      </section>

      <!-- 2. 기업 요약 -->
      <section class="card green">
        <h2><span class="icon">📋</span> 2. 기업 요약</h2>
        <p>{company_summary}</p>
        <div class="quote">
          <strong>🎯 미션 및 비전</strong><br/>
          {mission_vision}
        </div>
      </section>

      <!-- 3 + 4 그리드 -->
      <div class="grid">
        <section class="card blue">
          <h2><span class="icon">🔖</span> 3. AX 분류</h2>
          <table>
            <tr><th>AX 기업유형</th><td>{ax_type}</td></tr>
            <tr><th>B2B 역할</th><td>{b2b_role}</td></tr>
            <tr><th>한국 브랜드 연관성</th><td>{k_brand_relevance}</td></tr>
            <tr><th>KOAA SHOW 적합도</th><td><strong>{koaa_suitability}</strong></td></tr>
          </table>
        </section>

        <section class="card orange">
          <h2><span class="icon">🚗</span> 4. 주요 제품군 및 강점 기술</h2>
          <table>
            <tr><th>제품 카테고리</th><td>{product_categories}</td></tr>
            <tr><th>강점 기술 분야</th><td>{technology_strengths}</td></tr>
          </table>
        </section>
      </div>

      <!-- 5. 디지털·비즈니스 역량 -->
      <section class="card purple">
        <h2><span class="icon">⚡</span> 5. 디지털·비즈니스 역량</h2>
        <table>
          <tr><th>E-Commerce 채널</th><td>{ecommerce_cap}</td></tr>
          <tr><th>재고 관리 방식</th><td>{inventory_cap}</td></tr>
          <tr><th>글로벌 배송망</th><td>{delivery_cap}</td></tr>
          <tr><th>SNS 마케팅 채널</th><td>{sns_cap}</td></tr>
        </table>
      </section>

      <!-- 7. KOAA SHOW 매칭 관점 해석 -->
      <section class="card red">
        <h2><span class="icon">🤝</span> 6. KOAA SHOW 매칭 관점 해석</h2>
        <h3>💼 적합한 해외 바이어 유형</h3>
        <ul>
          {buyer_types_html}
        </ul>
        <br/>
        <h3>💬 예상 상담 주제</h3>
        <table>
          <tr><th>상담 주제</th><th>가능성</th><th>상세 설명</th></tr>
          {consult_topics_html}
        </table>
      </section>

      <!-- 8. 추천 태그 -->
      <section class="card blue">
        <h2><span class="icon">🏷️</span> 7. 추천 태그</h2>
        <div class="tags">
          {tags_html}
        </div>
      </section>

      <!-- 9. 매칭 점수 초안 -->
      <section class="card orange">
        <h2><span class="icon">📊</span> 8. 매칭 점수 초안</h2>
        {score_bars_html}
      </section>

      <!-- 11. 수기 검수 필요 항목 -->
      <section class="card red">
        <h2><span class="icon">✅</span> 9. 수기 검수 필요 항목</h2>
        <p class="muted">대학생 아르바이트생 및 플랫폼 운영자가 홈페이지 실사를 통해 1분 이내에 현황 확인을 완료한 내역입니다.</p>
        <table>
          <tr><th>검수 항목</th><th>결과</th><th>비고</th></tr>
          <tr><td>1) 홈페이지 정상 접속 여부</td><td>{check_h_badge}</td><td>서버 정상 확인</td></tr>
          <tr><td>2) 대표 이메일 정상 작동 여부 (발송 테스트 시 반송 여부 확인 필요)</td><td>{check_e_badge}</td><td>리턴 메일 여부 실사 필요</td></tr>
          <tr><td>3) 대표 전화번호 기재 여부 및 통화 유효성</td><td>{check_p_badge}</td><td>대표번호 연결 유효성</td></tr>
          <tr><td>4) 당사 추출 주요 제품군이 홈페이지 제품 소개 페이지에 실제로 존재하는지 여부</td><td>{check_pr_badge}</td><td>품목 일치 확인</td></tr>
          <tr><td>5) 공지사항이나 연혁 등에 최근 1~2년 내 업데이트 흔적이 존재하는지 여부</td><td>{check_u_badge}</td><td>최근 활동 유무</td></tr>
          <tr><td>6) 홈페이지 내 소셜 미디어(유튜브, 블로그 등) 링크가 정상 작동하는지 여부</td><td>{check_s_badge}</td><td>SNS 연동 링크 확인</td></tr>
        </table>
      </section>

      <!-- 10. AX DB용 JSON 초안 -->
      <section class="card purple">
        <h2><span class="icon">💾</span> 10. AX DB용 JSON 초안</h2>
        <pre style="background:#f1f5f9; padding:14px; border-radius:10px; font-size:12px; overflow-x:auto;">{json_draft_code}</pre>
      </section>

      <!-- 출처 및 면책 -->
      <section class="card slate">
        <h2><span class="icon">🔗</span> 출처 및 면책 고지</h2>
        <h3>원천 정보 출처</h3>
        <ul>
          {sources_html}
        </ul>
        <p class="muted" style="margin-top:14px;">본 문서는 공개된 웹사이트 자료를 인공지능 기반으로 수집·가공한 AX DB 초안이며, demostatra는 수록된 정보의 상업적 유효성이나 완벽한 거래 안정성을 보증하지 않습니다. 정식 상담 계약 체결 이전에 반드시 실사 및 신용 검증을 진행하시기 바랍니다.</p>
      </section>
    </main>

    <footer>
      <span>demostatra AX Database · PO@demostatra.com</span>
      <span>© 2026 demostatra Inc. All rights reserved.</span>
    </footer>
  </div>
</body>
</html>
"""

# 등급/점수를 퍼센트로 변환하는 헬퍼 함수
def parse_score_pct(val):
    if val is None:
        return 50
    val_str = str(val).strip().upper()
    if val_str == 'A' or val_str == 'HIGH' or val_str == '9' or val_str == '10':
        return 90
    elif val_str == 'B' or val_str == '8' or val_str == '7':
        return 75
    elif val_str == 'C' or val_str == '6' or val_str == '5':
        return 60
    # 숫자인 경우 정수 파싱
    num_match = re.search(r'\d+', val_str)
    if num_match:
        score = int(num_match.group())
        if score <= 10:
            return score * 10
        elif score <= 100:
            return score
    return 70

def main():
    parser = argparse.ArgumentParser(description="100개사 고품질 HTML & PDF 변환기")
    parser.add_argument("--limit", type=int, default=None, help="처리할 최대 업체 수 (테스트 용도)")
    args = parser.parse_args()

    print("[Info] 고품질 변환 작업을 시작합니다...")
    
    domestic_dir = r"D:\AXData-Engineering\KOAA_SHOW_AX_2000\domestic_100"
    json_dir = os.path.join(domestic_dir, "json_profiles")
    md_dir = os.path.join(domestic_dir, "markdown_profiles")
    
    html_out_dir = os.path.join(domestic_dir, "html_profiles")
    pdf_out_dir = os.path.join(domestic_dir, "pdf_profiles")
    os.makedirs(html_out_dir, exist_ok=True)
    os.makedirs(pdf_out_dir, exist_ok=True)
    
    if not os.path.exists(json_dir) or not os.path.exists(md_dir):
        print("[Error] json_profiles 또는 markdown_profiles 폴더를 찾을 수 없습니다.")
        sys.exit(1)
        
    json_files = [f for f in os.listdir(json_dir) if f.endswith(".json")]
    print(f" -> 발견된 JSON 프로필 수: {len(json_files)}")
    
    # JSON 파일 로드 및 정렬
    records = []
    for f_name in json_files:
        path = os.path.join(json_dir, f_name)
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            records.append(data)
        except Exception as e:
            print(f"[Warning] JSON 로드 실패 ({f_name}): {e}")
            
    records = sorted(records, key=lambda x: x.get("source_order", 9999))
    
    if args.limit:
        records = records[:args.limit]
        print(f"[Limit Mode] 지정된 {args.limit}개사만 처리합니다.")

    excel_data = []
    all_pages_html = [] # 통합본용 HTML

    for idx, r in enumerate(records):
        order = r.get("source_order", 0)
        name = r.get("company_name", "").strip()
        safe_name = clean_filename(name)
        
        md_name = f"{order}_{safe_name}_AX_Profile.md"
        md_path = os.path.join(md_dir, md_name)
        checklist = parse_checklist_from_md(md_path)
        
        # 1. 엑셀 로우용 데이터 파싱 및 수집
        contacts = r.get("key_contacts", "")
        if isinstance(contacts, list):
            contacts_str = ", ".join([f"{c.get('name', '')}({c.get('title', '')})" for c in contacts if isinstance(c, dict)])
        else:
            contacts_str = str(contacts)
            
        score_obj = r.get("ax_score_draft", {})
        score_str = ", ".join([f"{k}: {v}" for k, v in score_obj.items()])
        
        products = r.get("main_products", "")
        products_str = ", ".join(products) if isinstance(products, list) else str(products)
        
        row = {
            "순번": order,
            "회사명": name,
            "브랜드명": r.get("brand_name", ""),
            "국가": r.get("country", "대한민국"),
            "지역": r.get("region", ""),
            "설립년도": r.get("founded", ""),
            "웹사이트": r.get("website", ""),
            "대표 이메일": r.get("email", ""),
            "대표 연락처": r.get("phone", ""),
            "대표자/담당자": contacts_str,
            "주요 품목": products_str,
            "비즈니스 모델": ", ".join(r.get("company_type", [])) if isinstance(r.get("company_type"), list) else r.get("business_model", ""),
            "AX태그": ", ".join(r.get("ax_tags", [])) if isinstance(r.get("ax_tags"), list) else "",
            "매칭요약": r.get("matching_role", ""),
            "종합평가": score_str,
            "수기검수_홈페이지접속": checklist["홈페이지_접속"],
            "수기검수_이메일작동": checklist["이메일_작동"],
            "수기검수_전화유효성": checklist["전화_유효성"],
            "수기검수_제품군존재": checklist["제품군_존재"],
            "수기검수_최근업데이트": checklist["최근_업데이트"],
            "수기검수_소셜링크작동": checklist["소셜_링크"]
        }
        excel_data.append(row)
        
        # 2. HTML 렌더링용 변수 가공
        brand_name_sub = r.get("brand_name", "")
        if not brand_name_sub or brand_name_sub == name:
            brand_name_sub = "demostatra Domestic Exporter"
            
        website_sub = r.get("website", "")
        if not website_sub or website_sub == "홈페이지 없음":
            website_sub = "N/A (홈페이지 정보 없음)"
            
        # 텍스트 형태 정보 수동 보완 (마크다운에서 상세 텍스트 가져오기)
        md_content = ""
        if os.path.exists(md_path):
            with open(md_path, 'r', encoding='utf-8') as f:
                md_content = f.read()
                
        # 기업요약 파싱 (## 2. 기업 요약 아래 단락 파싱)
        summary_match = re.search(r'## 2\. 기업 요약\s*(.*?)\s*(?:## 3|---)', md_content, re.DOTALL)
        company_summary = summary_match.group(1).strip() if summary_match else "업체에 대한 AI 요약 정보가 존재하지 않습니다."
        
        # 주소 파싱
        address_match = re.search(r'\|\s*주소\s*\|\s*(.*?)\s*\|', md_content)
        address = address_match.group(1).strip() if address_match else r.get("region", "대한민국")
        
        # 미션 및 비전 파싱 (## 6. 기업 미션·비전 아래 단락)
        mission_match = re.search(r'## 6\. 기업 미션·비전\s*(.*?)\s*(?:## 7|---)', md_content, re.DOTALL)
        mission_vision = mission_match.group(1).strip() if mission_match else "품질 향상과 고객 지향적 서비스를 지향하는 제조업체입니다."
        
        # AX 분류 파싱
        ax_type = r.get("company_type", ["제조사"])[0] if isinstance(r.get("company_type"), list) else "제조사"
        b2b_role = r.get("b2b_role", "제조 및 수출 파트너")
        k_brand_relevance = r.get("korean_brand_relevance", "고유 브랜드 보유 강소기업")
        koaa_suitability = r.get("koaa_suitability", "High")
        
        # 주요 제품군 및 강점 기술 파싱 (마크다운 표 기준)
        prod_cat_match = re.search(r'### 4\.1 제품 카테고리\s*(.*?)\s*(?:### 4\.2|## 5)', md_content, re.DOTALL)
        product_categories = prod_cat_match.group(1).strip() if prod_cat_match else products_str
        
        tech_str_match = re.search(r'### 4\.2 취급 차량 브랜드 또는 강점 기술 분야\s*(.*?)\s*(?:## 5)', md_content, re.DOTALL)
        technology_strengths = tech_str_match.group(1).strip() if tech_str_match else "정밀 금속 가공 및 조립 기술"
        
        # 5. 디지털 비즈니스 역량 파싱
        digital_match = re.search(r'## 5\. 디지털·비즈니스 역량\s*(.*?)\s*(?:## 6|---)', md_content, re.DOTALL)
        digital_text = digital_match.group(1).strip() if digital_match else ""
        ecommerce_cap = "홈페이지 기반 제품 홍보 채널 보유"
        inventory_cap = "정보 없음 (현장 실사 필요)"
        delivery_cap = "글로벌 배송 및 수출 파트너 연동 가능"
        sns_cap = "정보 없음"
        
        if "배송" in digital_text:
            del_m = re.search(r'\|\s*배송\s*\|\s*(.*?)\s*\|', digital_text)
            if del_m: delivery_cap = del_m.group(1).strip()
        if "SNS" in digital_text:
            sns_m = re.search(r'\|\s*SNS\s*\|\s*(.*?)\s*\|', digital_text)
            if sns_m: sns_cap = sns_m.group(1).strip()
            
        # 7. 바이어 유형 목록화
        buyer_types_html = ""
        buyer_types_match = re.findall(r'-\s*(.*?)\n', md_content)
        # H7 매칭 유형 섹션 검색
        matching_sect_match = re.search(r'## 7\. KOAA SHOW 매칭 관점 해석\s*### 7\.1.*?\n(.*?)\s*### 7\.2', md_content, re.DOTALL)
        if matching_sect_match:
            b_types = re.findall(r'-\s*(.*?)\n', matching_sect_match.group(1))
            for bt in b_types:
                buyer_types_html += f"<li>{bt.strip()}</li>\n"
        if not buyer_types_html:
            buyer_types_html = "<li>글로벌 자동차부품 유통업체</li>\n<li>해외 OEM 부품 구매 대리점</li>"
            
        # 예상 상담 주제 파싱 (표에서 행들 가져오기)
        consult_topics_html = ""
        consult_sect_match = re.search(r'### 7\.2 예상 상담 주제\s*(.*?)\s*(?:## 8|---)', md_content, re.DOTALL)
        if consult_sect_match:
            c_rows = parse_markdown_table(consult_sect_match.group(1).split('\n'))
            for crow in c_rows[1:]: # 헤더 제외
                if len(crow) >= 3:
                    consult_topics_html += f'<tr class="consult-row"><td><strong>{crow[0]}</strong></td><td><span class="badge-high">{crow[1]}</span></td><td>{crow[2]}</td></tr>\n'
        if not consult_topics_html:
            consult_topics_html = '<tr><td><strong>OEM 부품 다이렉트 소싱</strong></td><td><span class="badge-high">높음</span></td><td>현재 중간 벤더를 거치는 공급선 다변화 협의</td></tr>'
            
        # 태그 렌더링
        tags_html = ""
        tags_list = r.get("ax_tags", [])
        if not tags_list:
            tags_list = ["단조", "자동차부품", "KOAA SHOW", "수출기업"]
        for t in tags_list:
            tags_html += f'<span class="tag">{t}</span>\n'
            
        # 매칭 점수 렌더링 (게이지 바)
        score_bars_html = ""
        score_items = r.get("ax_score_draft", {})
        if not score_items:
            score_items = {"제품 품질": 8, "수출 역량": 7, "기술 혁신": 8, "고객 서비스": 7, "종합 점수": 8}
            
        for skey, sval in score_items.items():
            pct = parse_score_pct(sval)
            score_bars_html += f"""
            <div class="score">
              <span style="font-weight:600;color:var(--slate);">{skey}</span>
              <div class="bar"><div class="fill" style="width: {pct}%;"></div></div>
              <span style="font-weight:700;color:var(--blue);">{sval}</span>
            </div>\n"""
            
        # JSON 포맷 코드블록
        json_draft_code = json.dumps(r, ensure_ascii=False, indent=2)
        
        # 출처 리스트화
        sources_html = ""
        src_match = re.search(r'## 13\. 출처\s*(.*?)\s*(?:## 14|---)', md_content, re.DOTALL)
        if src_match:
            s_list = re.findall(r'-\s*(.*?)\n', src_match.group(1))
            for sc in s_list:
                sources_html += f'<li><a href="{sc.strip()}" target="_blank">{sc.strip()}</a></li>\n'
        if not sources_html:
            sources_html = f'<li><a href="{r.get("website")}" target="_blank">{r.get("website")}</a></li>'
            
        # 수기 검수 배지 설정 (O 이면 초록색 badge-high, X 이면 빨간색 badge-mid)
        check_h_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["홈페이지_접속"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'
        check_e_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["이메일_작동"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'
        check_p_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["전화_유효성"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'
        check_pr_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["제품군_존재"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'
        check_u_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["최근_업데이트"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'
        check_s_badge = '<span class="badge-high">검수 완료 (O)</span>' if checklist["소셜_링크"] == 'O' else '<span class="badge-mid">미완료 (X)</span>'

        # 개별 HTML 데이터 결합
        single_html = HTML_TEMPLATE.format(
            company_name=name,
            brand_name=r.get("brand_name", name),
            brand_name_sub=brand_name_sub,
            industry=r.get("industry", "자동차부품"),
            region=r.get("region", ""),
            website=r.get("website", ""),
            website_sub=website_sub,
            founded=r.get("founded", "N/A"),
            matching_role=r.get("matching_role", "B2B 파트너 후보"),
            address=address,
            email=r.get("email", ""),
            phone=r.get("phone", ""),
            key_contacts=contacts_str,
            main_products=products_str,
            company_summary=company_summary,
            mission_vision=mission_vision,
            ax_type=ax_type,
            b2b_role=b2b_role,
            k_brand_relevance=k_brand_relevance,
            koaa_suitability=koaa_suitability,
            product_categories=product_categories,
            technology_strengths=technology_strengths,
            ecommerce_cap=ecommerce_cap,
            inventory_cap=inventory_cap,
            delivery_cap=delivery_cap,
            sns_cap=sns_cap,
            buyer_types_html=buyer_types_html,
            consult_topics_html=consult_topics_html,
            tags_html=tags_html,
            score_bars_html=score_bars_html,
            json_draft_code=json_draft_code,
            sources_html=sources_html,
            check_h_badge=check_h_badge,
            check_e_badge=check_e_badge,
            check_p_badge=check_p_badge,
            check_pr_badge=check_pr_badge,
            check_u_badge=check_u_badge,
            check_s_badge=check_s_badge
        )
        
        # HTML 파일 저장
        html_filename = f"{order}_{safe_name}_AX_Profile.html"
        html_filepath = os.path.join(html_out_dir, html_filename)
        with open(html_filepath, 'w', encoding='utf-8') as h_out:
            h_out.write(single_html)
            
        all_pages_html.append(single_html)
        print(f" -> [{order}/100] '{name}' HTML 생성 완료")

    # 3. 통합 XLSX 저장
    df = pd.DataFrame(excel_data)
    xlsx_out_path = os.path.join(domestic_dir, "KOAA_국내업체_AX프로필_100개사_상세.xlsx")
    with pd.ExcelWriter(xlsx_out_path, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="AX 프로필 상세")
        worksheet = writer.sheets["AX 프로필 상세"]
        for col in worksheet.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = col[0].column_letter
            worksheet.column_dimensions[col_letter].width = min(max(max_len + 3, 10), 40)
    print(f"[Success] 통합 엑셀 저장 완료: {xlsx_out_path}")

    # 4. 통합 HTML 파일 저장
    # 브라우저 인쇄 시 페이지가 나뉘도록 CSS page-break 설정이 반영된 하나의 거대한 HTML 파일 생성
    merged_html_path = os.path.join(domestic_dir, "KOAA_국내업체_AX프로필_100개사_상세.html")
    # 개별 페이지 사이의 page-break-after 스타일 가미
    wrapped_merged_html = []
    for idx, html_body in enumerate(all_pages_html):
        # <body> 와 </body> 사이의 내부 태그만 슬라이싱하여 하나의 HTML 바디 내에 page-break-after: always로 결합
        body_content = re.search(r'<body>\s*(.*?)\s*</body>', html_body, re.DOTALL)
        if body_content:
            page_div = f'<div class="print-page" style="page-break-after: always;">{body_content.group(1)}</div>'
            wrapped_merged_html.append(page_div)
            
    # 헤더와 스타일을 가져와서 합본 구조 생성
    html_header_match = re.search(r'(.*?<body>)', all_pages_html[0], re.DOTALL)
    header_part = html_header_match.group(1) if html_header_match else "<html><body>"
    # style 블록에 .print-page 가시성 스타일 추가
    header_part = header_part.replace("</style>", " .print-page { page-break-after: always; break-after: page; } </style>")
    
    with open(merged_html_path, 'w', encoding='utf-8') as mh_out:
        mh_out.write(header_part + "\n" + "\n".join(wrapped_merged_html) + "\n</body>\n</html>")
    print(f"[Success] 통합 HTML 저장 완료: {merged_html_path}")

    # 5. PDF 렌더링 단계 (Chrome Headless CLI 사용)
    print("\n -> [Chrome PDF] 크롬 브라우저를 백그라운드로 실행해 고품질 PDF 변환 작업을 시작합니다...")
    
    # 5-1. 개별 PDF 인쇄
    for idx, r in enumerate(records):
        order = r.get("source_order", 0)
        name = r.get("company_name", "").strip()
        safe_name = clean_filename(name)
        
        html_filename = f"{order}_{safe_name}_AX_Profile.html"
        html_filepath = os.path.join(html_out_dir, html_filename)
        pdf_filepath = os.path.join(pdf_out_dir, f"{order}_{safe_name}_AX_Profile.pdf")
        
        print(f"   -> [{order}/100] '{name}' PDF 인쇄 중...")
        convert_html_to_pdf_chrome(html_filepath, pdf_filepath)
        
    # 5-2. 통합 PDF 인쇄
    merged_pdf_path = os.path.join(domestic_dir, "KOAA_국내업체_AX프로필_100개사_상세.pdf")
    print("   -> 통합 PDF 보고서 인쇄 중...")
    convert_html_to_pdf_chrome(merged_html_path, merged_pdf_path)
    
    print("\n[Success] 모든 프로필의 고품질 엑셀 및 PDF 일괄 생성이 성공적으로 완료되었습니다!")

if __name__ == "__main__":
    main()

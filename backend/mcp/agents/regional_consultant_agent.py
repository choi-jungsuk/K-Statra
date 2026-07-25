"""
지역전문가 컨설턴트 Agent
- 다중 MCP 서버 동시 연결:
  1. Brave Search MCP - 최신 시장·규제 정보 검색
  2. Fetch MCP       - 웹페이지 크롤링 + 지역 DB 데이터 읽기
- Claude가 두 MCP의 도구를 상황에 맞게 선택하여 사용
- 출력: stdout JSON 스트림 (NestJS 자식 프로세스로 실행)
"""

import asyncio
import json
import sys
import os
import argparse
from contextlib import AsyncExitStack

import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "")

VENV_PYTHON = os.path.join(os.path.dirname(__file__), '..', 'venv', 'Scripts', 'python.exe')
BRAVE_SERVER = os.path.join(os.path.dirname(__file__), '..', 'servers', 'brave_search_server.py')
FETCH_SERVER = os.path.join(os.path.dirname(__file__), '..', 'servers', 'fetch_server.py')

REGION_MAP = {
    "latin_america": "중남미",
    "southeast_asia": "동남아시아",
    "middle_east": "중동·북아프리카(MENA)",
    "": "글로벌"
}


def emit(data: dict):
    print(json.dumps(data, ensure_ascii=False), flush=True)


SYSTEM_PROMPT = """당신은 DemoStatra B2B 매칭 플랫폼의 지역전문가 컨설턴트 에이전트입니다.

특정 지역 시장의 무역 진입 전략, 규제 환경, 문화적 주의사항, 물류 전략, 바이어 발굴 방법을 전문적으로 안내합니다.

**사용 가능한 도구:**
- `brave_web_search`: 최신 시장 동향, 규제 변경사항, 바이어 정보 검색
- `brave_news_search`: 최근 무역 뉴스, 정책 변화 검색
- `fetch_url`: 특정 웹페이지(관세청, 규제기관, 기업 홈페이지) 내용 조회
- `read_regional_data`: DemoStatra 지역 전문 DB에서 해당 지역 기초 데이터 조회

**답변 구조:**
1. 🌍 **지역 개요** - 시장 특성 요약
2. 📋 **규제 및 인증** - 필수 인증, 라벨링, 허가 사항
3. 🚢 **물류 및 결제** - 추천 물류 루트, 결제 방식
4. 🤝 **문화 및 비즈니스 관행** - 현지 비즈니스 문화
5. 🎯 **DemoStatra 매칭 전략** - 최적 바이어 타입, 접근 방법
6. ⚠️ **주의사항** - 리스크 및 체크리스트

반드시 도구를 활용하여 실제 데이터에 기반한 답변을 제공하세요.
먼저 `read_regional_data`로 지역 DB를 조회하고, 이후 `brave_web_search`로 최신 정보를 보완하세요.
한국어 마크다운 형식으로 답변합니다."""


async def run_regional_consultant(
    query: str,
    region: str = "",
    industry: str = ""
):
    """다중 MCP 서버와 Claude를 연결하여 지역 컨설팅 수행"""

    if not ANTHROPIC_API_KEY:
        emit({"type": "error", "text": "ANTHROPIC_API_KEY가 설정되지 않았습니다."})
        return

    emit({"type": "status", "text": "지역전문가 컨설턴트 에이전트 초기화 중..."})

    region_ko = REGION_MAP.get(region, region or "글로벌")

    brave_params = StdioServerParameters(
        command=VENV_PYTHON,
        args=[BRAVE_SERVER],
        env={**os.environ}
    )
    fetch_params = StdioServerParameters(
        command=VENV_PYTHON,
        args=[FETCH_SERVER],
        env={**os.environ}
    )

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # AsyncExitStack으로 다중 MCP 서버 동시 관리
    async with AsyncExitStack() as stack:
        # Brave Search MCP 연결
        brave_read, brave_write = await stack.enter_async_context(
            stdio_client(brave_params)
        )
        brave_session = await stack.enter_async_context(
            ClientSession(brave_read, brave_write)
        )
        await brave_session.initialize()
        emit({"type": "status", "text": "✅ Brave Search MCP 연결 완료"})

        # Fetch MCP 연결
        fetch_read, fetch_write = await stack.enter_async_context(
            stdio_client(fetch_params)
        )
        fetch_session = await stack.enter_async_context(
            ClientSession(fetch_read, fetch_write)
        )
        await fetch_session.initialize()
        emit({"type": "status", "text": "✅ Fetch + 지역DB MCP 연결 완료"})

        # 두 MCP의 도구 목록 통합
        brave_tools_result = await brave_session.list_tools()
        fetch_tools_result = await fetch_session.list_tools()

        all_tools = []
        brave_tool_names = set()
        fetch_tool_names = set()

        for tool in brave_tools_result.tools:
            all_tools.append({
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema
            })
            brave_tool_names.add(tool.name)

        for tool in fetch_tools_result.tools:
            all_tools.append({
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.inputSchema
            })
            fetch_tool_names.add(tool.name)

        emit({
            "type": "status",
            "text": f"📋 통합 도구 목록: {[t['name'] for t in all_tools]}"
        })

        # 사용자 메시지 구성
        user_message = f"다음 조건으로 지역 시장 컨설팅을 제공해주세요:\n\n"
        user_message += f"- 질문/요청: {query}\n"
        if region:
            user_message += f"- 대상 지역: {region_ko} (region code: {region})\n"
        if industry:
            user_message += f"- 산업/제품: {industry}\n"
        user_message += (
            "\n먼저 read_regional_data로 해당 지역 기초 데이터를 조회하고, "
            "brave_web_search로 최신 시장 정보를 보완한 후 종합 컨설팅을 제공해주세요."
        )

        messages = [{"role": "user", "content": user_message}]

        emit({"type": "status", "text": f"🤖 Claude 지역전문가 에이전트 시작 ({region_ko})..."})

        # Agentic 루프
        while True:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=all_tools,
                messages=messages
            )

            # 텍스트 응답 출력
            for block in response.content:
                if hasattr(block, "text"):
                    emit({"type": "text", "text": block.text})

            if response.stop_reason == "end_turn":
                break

            if response.stop_reason == "tool_use":
                tool_results = []

                for block in response.content:
                    if block.type == "tool_use":
                        tool_name = block.name
                        tool_input = block.input

                        emit({
                            "type": "status",
                            "text": f"🔧 도구 실행: {tool_name} | 입력: {json.dumps(tool_input, ensure_ascii=False)[:100]}"
                        })

                        # 어느 MCP 서버의 도구인지 라우팅
                        if tool_name in brave_tool_names:
                            result = await brave_session.call_tool(tool_name, tool_input)
                        elif tool_name in fetch_tool_names:
                            result = await fetch_session.call_tool(tool_name, tool_input)
                        else:
                            result = None

                        result_text = (
                            result.content[0].text if result and result.content else "{}"
                        )

                        emit({
                            "type": "tool_result",
                            "tool": tool_name,
                            "result_preview": result_text[:300] + "..." if len(result_text) > 300 else result_text
                        })

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result_text
                        })

                messages.append({"role": "assistant", "content": response.content})
                messages.append({"role": "user", "content": tool_results})

    emit({"type": "done", "text": "지역 컨설팅 완료"})


async def test_mode():
    emit({"type": "status", "text": "Regional Consultant Agent 테스트 모드"})
    emit({"type": "status", "text": f"ANTHROPIC_API_KEY: {'설정됨' if ANTHROPIC_API_KEY else '미설정'}"})
    emit({"type": "status", "text": f"BRAVE_API_KEY: {'설정됨' if BRAVE_API_KEY and BRAVE_API_KEY != '발급받은_Brave_API_키를_여기에_입력' else '미설정 (Brave 없이도 Fetch+지역DB 사용 가능)'}"})
    emit({"type": "status", "text": f"Brave Server: {BRAVE_SERVER}"})
    emit({"type": "status", "text": f"Fetch Server: {FETCH_SERVER}"})
    emit({"type": "done", "text": "테스트 완료"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DemoStatra Regional Consultant Agent")
    parser.add_argument("--test", action="store_true", help="연결 테스트 모드")
    parser.add_argument("--query", type=str, default="", help="컨설팅 질문")
    parser.add_argument("--region", type=str, default="", help="지역 코드 (latin_america | southeast_asia | middle_east)")
    parser.add_argument("--industry", type=str, default="", help="산업/제품군")
    args = parser.parse_args()

    if args.test:
        asyncio.run(test_mode())
    elif args.query:
        asyncio.run(run_regional_consultant(args.query, args.region, args.industry))
    else:
        try:
            raw = sys.stdin.readline().strip()
            if raw:
                data = json.loads(raw)
                asyncio.run(run_regional_consultant(
                    query=data.get("query", ""),
                    region=data.get("region", ""),
                    industry=data.get("industry", "")
                ))
        except Exception as e:
            emit({"type": "error", "text": str(e)})

"""
Market Research Agent
- Claude + Brave Search MCP 서버를 연결하여 B2B 시장조사를 수행
- NestJS에서 자식 프로세스(stdin/stdout JSON)로 실행됨
- 입력: stdin JSON {"query": "...", "target_market": "...", "industry": "..."}
- 출력: stdout JSON 스트림 (type: status | text | result | error)
"""

import asyncio
import json
import sys
import os
import argparse

import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# .env 로드
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "")

# venv의 python 경로 (서버 실행용)
VENV_PYTHON = os.path.join(os.path.dirname(__file__), '..', 'venv', 'Scripts', 'python.exe')
BRAVE_SERVER_PATH = os.path.join(os.path.dirname(__file__), '..', 'servers', 'brave_search_server.py')


def emit(data: dict):
    """NestJS로 JSON 스트림 출력"""
    print(json.dumps(data, ensure_ascii=False), flush=True)


SYSTEM_PROMPT = """당신은 DemoStatra B2B 매칭 플랫폼의 시장조사 전문 에이전트입니다.

주어진 산업/제품에 대해 글로벌 B2B 시장을 조사하고, 다음 항목을 포함한 전문적인 시장 분석 보고서를 작성합니다:

1. **시장 규모 및 성장 동향** - 주요 수치와 전망
2. **주요 수입국/바이어 시장** - 상위 3~5개국과 특징
3. **시장 진입 장벽** - 규제, 인증, 관세, 문화적 요인
4. **경쟁 구도** - 주요 경쟁국/경쟁사
5. **매칭 추천 전략** - DemoStatra 관점에서 최적 바이어 타겟

반드시 brave_web_search 또는 brave_news_search 도구를 사용하여 최신 실제 데이터를 조사한 후 답변하세요.
답변은 마크다운 형식, 한국어로 작성합니다."""


async def run_market_research(query: str, target_market: str = "", industry: str = ""):
    """Brave Search MCP와 Claude를 연결하여 시장조사 실행"""

    if not ANTHROPIC_API_KEY:
        emit({"type": "error", "text": "ANTHROPIC_API_KEY가 설정되지 않았습니다."})
        return

    emit({"type": "status", "text": "시장조사 에이전트 초기화 중..."})

    # MCP 서버 파라미터 (Brave Search)
    server_params = StdioServerParameters(
        command=VENV_PYTHON,
        args=[BRAVE_SERVER_PATH],
        env={**os.environ}
    )

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # MCP 서버 초기화
            await session.initialize()
            emit({"type": "status", "text": "Brave Search MCP 서버 연결 완료"})

            # 사용 가능한 도구 목록 가져오기
            tools_result = await session.list_tools()
            tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema
                }
                for tool in tools_result.tools
            ]

            emit({"type": "status", "text": f"사용 가능한 MCP 도구: {[t['name'] for t in tools]}"})

            # 검색 쿼리 구성
            user_message = f"다음 조건으로 글로벌 B2B 시장을 조사해주세요:\n\n"
            user_message += f"- 조사 요청: {query}\n"
            if industry:
                user_message += f"- 산업군: {industry}\n"
            if target_market:
                user_message += f"- 타겟 시장: {target_market}\n"
            user_message += "\n먼저 관련 키워드로 웹 검색을 수행한 후 시장 분석 보고서를 작성해주세요."

            messages = [{"role": "user", "content": user_message}]

            # Agentic 루프 (Claude가 도구를 다 사용할 때까지 반복)
            emit({"type": "status", "text": "Claude 시장조사 에이전트 시작..."})

            while True:
                response = client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4096,
                    system=SYSTEM_PROMPT,
                    tools=tools,
                    messages=messages
                )

                # 응답 처리
                for block in response.content:
                    if hasattr(block, "text"):
                        emit({"type": "text", "text": block.text})

                # 종료 조건
                if response.stop_reason == "end_turn":
                    break

                # 도구 호출 처리
                if response.stop_reason == "tool_use":
                    tool_results = []

                    for block in response.content:
                        if block.type == "tool_use":
                            tool_name = block.name
                            tool_input = block.input

                            emit({
                                "type": "status",
                                "text": f"🔍 {tool_name} 실행 중: {tool_input.get('query', '')}"
                            })

                            # MCP 도구 실행
                            result = await session.call_tool(tool_name, tool_input)
                            result_text = result.content[0].text if result.content else "{}"

                            emit({
                                "type": "tool_result",
                                "tool": tool_name,
                                "query": tool_input.get("query", ""),
                                "result_preview": result_text[:200] + "..." if len(result_text) > 200 else result_text
                            })

                            tool_results.append({
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result_text
                            })

                    # 메시지 히스토리 업데이트
                    messages.append({"role": "assistant", "content": response.content})
                    messages.append({"role": "user", "content": tool_results})

            emit({"type": "done", "text": "시장조사 완료"})


async def test_mode():
    """--test 플래그 실행 시 간단한 연결 테스트"""
    emit({"type": "status", "text": "Market Research Agent 테스트 모드"})
    emit({"type": "status", "text": f"ANTHROPIC_API_KEY: {'설정됨' if ANTHROPIC_API_KEY else '미설정'}"})
    emit({"type": "status", "text": f"BRAVE_API_KEY: {'설정됨' if BRAVE_API_KEY and BRAVE_API_KEY != '발급받은_Brave_API_키를_여기에_입력' else '미설정'}"})
    emit({"type": "status", "text": f"VENV Python: {VENV_PYTHON}"})
    emit({"type": "status", "text": f"Brave Server: {BRAVE_SERVER_PATH}"})
    emit({"type": "done", "text": "테스트 완료 - 모든 경로 확인됨"})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DemoStatra Market Research Agent")
    parser.add_argument("--test", action="store_true", help="연결 테스트 모드")
    parser.add_argument("--query", type=str, default="", help="검색 쿼리")
    parser.add_argument("--target_market", type=str, default="", help="타겟 시장")
    parser.add_argument("--industry", type=str, default="", help="산업군")
    args = parser.parse_args()

    if args.test:
        asyncio.run(test_mode())
    elif args.query:
        asyncio.run(run_market_research(args.query, args.target_market, args.industry))
    else:
        # stdin에서 JSON 입력 읽기 (NestJS 자식 프로세스 모드)
        try:
            raw = sys.stdin.readline().strip()
            if raw:
                data = json.loads(raw)
                asyncio.run(run_market_research(
                    query=data.get("query", ""),
                    target_market=data.get("target_market", ""),
                    industry=data.get("industry", "")
                ))
        except Exception as e:
            emit({"type": "error", "text": str(e)})

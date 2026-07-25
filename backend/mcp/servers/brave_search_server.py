"""
Brave Search MCP 서버
- DemoStatra 시장조사 에이전트가 사용하는 MCP 서버
- Brave Search API를 MCP 도구로 래핑
- transport: stdio (NestJS가 자식 프로세스로 실행)
"""

import asyncio
import httpx
import os
import sys
import json

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types

# .env 로드 (venv 환경에서 실행되므로 프로젝트 루트 기준)
try:
    from dotenv import load_dotenv
    # 프로젝트 루트의 .env 로드
    env_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env')
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY", "")
BRAVE_API_URL = "https://api.search.brave.com/res/v1/web/search"

app = Server("brave-search-mcp")


@app.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """MCP 도구 목록 반환"""
    return [
        types.Tool(
            name="brave_web_search",
            description=(
                "Brave Search API를 사용하여 웹을 검색합니다. "
                "시장 동향, 기업 정보, 무역 규제, 지역 시장 데이터 등을 검색하는 데 사용합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "검색할 키워드 또는 문장 (영어 또는 한국어)"
                    },
                    "count": {
                        "type": "integer",
                        "description": "반환할 검색 결과 수 (기본값: 5, 최대: 10)",
                        "default": 5
                    },
                    "country": {
                        "type": "string",
                        "description": "검색 대상 국가 코드 (예: KR, US, VN, MX). 미입력 시 전체",
                        "default": ""
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="brave_news_search",
            description=(
                "Brave News API를 사용하여 최신 뉴스를 검색합니다. "
                "최근 시장 이슈, 무역 정책 변화, 기업 뉴스 등을 파악할 때 사용합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "검색할 뉴스 키워드"
                    },
                    "count": {
                        "type": "integer",
                        "description": "반환할 뉴스 수 (기본값: 5)",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(
    name: str, arguments: dict
) -> list[types.TextContent]:
    """MCP 도구 실행"""

    if not BRAVE_API_KEY or BRAVE_API_KEY == "발급받은_Brave_API_키를_여기에_입력":
        return [types.TextContent(
            type="text",
            text=json.dumps({
                "error": "BRAVE_API_KEY가 설정되지 않았습니다. .env 파일에 BRAVE_API_KEY를 입력해주세요.",
                "results": []
            }, ensure_ascii=False)
        )]

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        if name == "brave_web_search":
            query = arguments.get("query", "")
            count = min(arguments.get("count", 5), 10)
            country = arguments.get("country", "")

            params = {"q": query, "count": count}
            if country:
                params["country"] = country

            resp = await client.get(BRAVE_API_URL, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

            results = []
            for item in data.get("web", {}).get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                    "age": item.get("age", "")
                })

            return [types.TextContent(
                type="text",
                text=json.dumps({
                    "query": query,
                    "total_results": len(results),
                    "results": results
                }, ensure_ascii=False, indent=2)
            )]

        elif name == "brave_news_search":
            query = arguments.get("query", "")
            count = min(arguments.get("count", 5), 10)

            params = {"q": query, "count": count, "result_filter": "news"}
            resp = await client.get(BRAVE_API_URL, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()

            results = []
            for item in data.get("news", {}).get("results", []):
                results.append({
                    "title": item.get("title", ""),
                    "url": item.get("url", ""),
                    "description": item.get("description", ""),
                    "age": item.get("age", ""),
                    "source": item.get("meta_url", {}).get("hostname", "")
                })

            return [types.TextContent(
                type="text",
                text=json.dumps({
                    "query": query,
                    "total_news": len(results),
                    "results": results
                }, ensure_ascii=False, indent=2)
            )]

        else:
            raise ValueError(f"알 수 없는 도구: {name}")


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="brave-search-mcp",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )


if __name__ == "__main__":
    asyncio.run(main())

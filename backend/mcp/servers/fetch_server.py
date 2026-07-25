"""
Fetch MCP 서버
- 웹 URL의 HTML/텍스트 콘텐츠를 가져오는 MCP 서버
- 지역전문가 컨설턴트 에이전트가 관세율, 규제 페이지 등을 조회할 때 사용
- transport: stdio
"""

import asyncio
import httpx
import os
import json
import re
from html.parser import HTMLParser

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types

app = Server("fetch-mcp")

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)


class HTMLTextExtractor(HTMLParser):
    """HTML에서 순수 텍스트 추출"""
    def __init__(self):
        super().__init__()
        self._texts = []
        self._skip_tags = {'script', 'style', 'head', 'nav', 'footer'}
        self._current_skip = 0

    def handle_starttag(self, tag, attrs):
        if tag.lower() in self._skip_tags:
            self._current_skip += 1

    def handle_endtag(self, tag):
        if tag.lower() in self._skip_tags:
            self._current_skip = max(0, self._current_skip - 1)

    def handle_data(self, data):
        if self._current_skip == 0:
            stripped = data.strip()
            if stripped:
                self._texts.append(stripped)

    def get_text(self) -> str:
        text = '\n'.join(self._texts)
        # 연속 공백/개행 정리
        text = re.sub(r'\n{3,}', '\n\n', text)
        return text.strip()


@app.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="fetch_url",
            description=(
                "웹 URL에서 페이지 내용을 가져옵니다. "
                "관세율 조회, 규제 정보 페이지, 기업 홈페이지 등을 분석할 때 사용합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "가져올 웹 페이지 URL (https:// 포함)"
                    },
                    "max_length": {
                        "type": "integer",
                        "description": "반환할 최대 텍스트 길이 (기본값: 5000자)",
                        "default": 5000
                    }
                },
                "required": ["url"]
            }
        ),
        types.Tool(
            name="read_regional_data",
            description=(
                "DemoStatra 지역 전문 데이터베이스에서 특정 지역의 무역·시장 정보를 읽어옵니다. "
                "중남미(latin_america), 동남아(southeast_asia), 중동(middle_east) 데이터를 조회합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "region": {
                        "type": "string",
                        "description": "지역 코드: latin_america | southeast_asia | middle_east",
                        "enum": ["latin_america", "southeast_asia", "middle_east"]
                    }
                },
                "required": ["region"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "fetch_url":
        url = arguments.get("url", "")
        max_length = arguments.get("max_length", 5000)

        if not url.startswith("http"):
            return [types.TextContent(type="text", text=json.dumps({
                "error": "유효하지 않은 URL입니다. https:// 로 시작해야 합니다."
            }, ensure_ascii=False))]

        try:
            async with httpx.AsyncClient(
                timeout=15.0,
                headers={"User-Agent": USER_AGENT},
                follow_redirects=True
            ) as client:
                resp = await client.get(url)
                resp.raise_for_status()

                content_type = resp.headers.get("content-type", "")
                if "html" in content_type:
                    extractor = HTMLTextExtractor()
                    extractor.feed(resp.text)
                    text = extractor.get_text()
                else:
                    text = resp.text

                # 길이 제한
                if len(text) > max_length:
                    text = text[:max_length] + f"\n\n... (총 {len(text)}자 중 {max_length}자 표시)"

                return [types.TextContent(type="text", text=json.dumps({
                    "url": url,
                    "status": resp.status_code,
                    "content": text
                }, ensure_ascii=False, indent=2))]

        except httpx.TimeoutException:
            return [types.TextContent(type="text", text=json.dumps({
                "error": f"URL 요청 타임아웃: {url}"
            }, ensure_ascii=False))]
        except Exception as e:
            return [types.TextContent(type="text", text=json.dumps({
                "error": f"URL 접근 실패: {str(e)}"
            }, ensure_ascii=False))]

    elif name == "read_regional_data":
        region = arguments.get("region", "")
        data_path = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'regional', f'{region}.json'
        )
        if not os.path.exists(data_path):
            return [types.TextContent(type="text", text=json.dumps({
                "error": f"지역 데이터를 찾을 수 없습니다: {region}"
            }, ensure_ascii=False))]

        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return [types.TextContent(
            type="text",
            text=json.dumps(data, ensure_ascii=False, indent=2)
        )]

    else:
        raise ValueError(f"알 수 없는 도구: {name}")


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="fetch-mcp",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={}
                )
            )
        )


if __name__ == "__main__":
    asyncio.run(main())

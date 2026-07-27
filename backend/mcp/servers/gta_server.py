"""
Global Trade Alert (GTA) Trade Policy MCP 서버
- 관세율, 무역 장벽, HS 코드별 글로벌 규제 조치 및 공식 문서 시행일자 인용
- transport: stdio
"""

import asyncio
import os
import sys
import json

from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.server.stdio import stdio_server
from mcp import types

from gta_mcp_client import gta_client

app = Server("gta-trade-policy-mcp")


@app.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """GTA MCP 도구 목록 반환"""
    return [
        types.Tool(
            name="search_tariff_rates",
            description=(
                "Global Trade Alert(GTA) 데이터베이스를 기반으로 HS 코드 및 대상 국가의 실시간 관세율(MFN 관세율, FTA 협정관세율) 및 "
                "무역 조치를 조회합니다. 제품 및 수출 대상국 관세 정보를 확인할 때 반드시 호출하세요."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "hs_code": {
                        "type": "string",
                        "description": "HS 코드 (예: 8507.60, 7208, 3304 등)"
                    },
                    "country": {
                        "type": "string",
                        "description": "대상 수출 국가명 (예: 미국, EU, 동남아시아, 중남미 등)",
                        "default": "미국"
                    }
                },
                "required": ["hs_code"]
            }
        ),
        types.Tool(
            name="analyze_trade_barriers",
            description=(
                "반덤핑, 상계관세, 수출통제, CBAM, IRA, MoCRA 등 해당 품목(HS 코드) 및 국가의 비관세 장벽과 규제 인증 요건을 "
                "공식 문서 링크 및 시행일자와 함께 상세 분석합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "hs_code": {
                        "type": "string",
                        "description": "HS 코드 (예: 8507.60, 7208, 3304 등)"
                    },
                    "country": {
                        "type": "string",
                        "description": "대상 수출 국가명 (예: 미국, EU, 동남아시아 등)",
                        "default": "미국"
                    },
                    "keyword": {
                        "type": "string",
                        "description": "특정 규제 키워드 (예: 반덤핑, 할랄, 라벨링 등)",
                        "default": ""
                    }
                },
                "required": ["hs_code"]
            }
        ),
        types.Tool(
            name="get_hs_code_measures",
            description=(
                "HS 코드별 글로벌 무역 개입 조치(Interventions) 요약 및 공식 원본 법령 문서 시행 링크를 종합하여 조회합니다."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "hs_code": {
                        "type": "string",
                        "description": "HS 코드"
                    },
                    "country": {
                        "type": "string",
                        "description": "국가명",
                        "default": "미국"
                    }
                },
                "required": ["hs_code"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(
    name: str, arguments: dict | None
) -> list[types.TextContent]:
    """도구 호출 핸들러"""
    args = arguments or {}

    if name == "search_tariff_rates":
        hs_code = args.get("hs_code", "")
        country = args.get("country", "")
        result = gta_client.search_tariff_rates(hs_code, country)
        return [
            types.TextContent(
                type="text",
                text=json.dumps(result, ensure_ascii=False, indent=2)
            )
        ]

    elif name == "analyze_trade_barriers":
        hs_code = args.get("hs_code", "")
        country = args.get("country", "")
        keyword = args.get("keyword", "")
        result = gta_client.analyze_trade_barriers(hs_code, country, keyword)
        return [
            types.TextContent(
                type="text",
                text=json.dumps(result, ensure_ascii=False, indent=2)
            )
        ]

    elif name == "get_hs_code_measures":
        hs_code = args.get("hs_code", "")
        country = args.get("country", "")
        result = gta_client.get_hs_code_measures(hs_code, country)
        return [
            types.TextContent(
                type="text",
                text=json.dumps(result, ensure_ascii=False, indent=2)
            )
        ]

    else:
        return [
            types.TextContent(
                type="text",
                text=json.dumps({"error": f"알 수 없는 도구: {name}"}, ensure_ascii=False)
            )
        ]


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="gta-trade-policy-mcp",
                server_version="1.0.0",
                capabilities=app.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )


if __name__ == "__main__":
    asyncio.run(main())

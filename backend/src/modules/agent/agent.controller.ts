import {
  Controller,
  Post,
  Body,
  Sse,
  Query,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { AgentService } from './agent.service';
import { MarketResearchService } from './market-research.service';
import { RegionalConsultantService } from './regional-consultant.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly marketResearchService: MarketResearchService,
    private readonly regionalConsultantService: RegionalConsultantService,
  ) {}

  // ─────────────────────────────────────────────
  // 기존 에이전트 엔드포인트
  // ─────────────────────────────────────────────

  @Post('chat')
  @ApiOperation({ summary: 'Azure AI 기반 파트너 추천 및 질의응답' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '자동차 부품 수출업체를 찾아줘' },
      },
    },
  })
  async chat(@Body('message') message: string) {
    return this.agentService.chatWithAgent(message);
  }

  @Sse('chat-stream')
  @ApiOperation({
    summary: 'Claude 에이전트 실시간 SSE 스트리밍 답변 및 도구 연동',
  })
  @ApiQuery({
    name: 'message',
    type: 'string',
    description: '사용자의 입력 질문',
  })
  @ApiQuery({
    name: 'history',
    type: 'string',
    required: false,
    description: '이전 대화 내역 (JSON 배열 문자열)',
  })
  chatStream(
    @Query('message') message: string,
    @Query('history') history?: string,
  ): Observable<MessageEvent> {
    return this.agentService.chatWithClaudeAgentStream(message, history).pipe(
      map(
        (event) =>
          ({
            data: event.data,
          }) as MessageEvent,
      ),
    );
  }

  // ─────────────────────────────────────────────
  // MCP 연동 에이전트 엔드포인트
  // ─────────────────────────────────────────────

  @Sse('market-research')
  @ApiOperation({
    summary: '[MCP] 시장조사 에이전트 - Brave Search MCP 연동 실시간 스트리밍',
  })
  @ApiQuery({ name: 'query', type: 'string', description: '시장조사 요청 (예: 동남아 K-뷰티 시장 현황)' })
  @ApiQuery({ name: 'target_market', type: 'string', required: false, description: '타겟 시장 (예: 베트남, 인도네시아)' })
  @ApiQuery({ name: 'industry', type: 'string', required: false, description: '산업군 (예: 화장품, 자동차부품)' })
  marketResearchStream(
    @Query('query') query: string,
    @Query('target_market') target_market?: string,
    @Query('industry') industry?: string,
  ): Observable<MessageEvent> {
    return this.marketResearchService
      .runMarketResearch({ query, target_market, industry })
      .pipe(
        map((event) => ({ data: event.data }) as MessageEvent),
      );
  }

  @Sse('regional-consultant')
  @ApiOperation({
    summary: '[MCP] 지역전문가 컨설턴트 - Brave Search + Fetch 다중 MCP 연동',
  })
  @ApiQuery({ name: 'query', type: 'string', description: '컨설팅 질문 (예: 베트남 화장품 규제 및 진입 전략)' })
  @ApiQuery({
    name: 'region',
    type: 'string',
    required: false,
    enum: ['latin_america', 'southeast_asia', 'middle_east'],
    description: '대상 지역 코드',
  })
  @ApiQuery({ name: 'industry', type: 'string', required: false, description: '산업/제품군' })
  regionalConsultantStream(
    @Query('query') query: string,
    @Query('region') region?: 'latin_america' | 'southeast_asia' | 'middle_east',
    @Query('industry') industry?: string,
  ): Observable<MessageEvent> {
    return this.regionalConsultantService
      .runRegionalConsultant({ query, region, industry })
      .pipe(
        map((event) => ({ data: event.data }) as MessageEvent),
      );
  }
}

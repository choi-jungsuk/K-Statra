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
import { RegionalConsultantService } from './regional-consultant.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly regionalConsultantService: RegionalConsultantService,
  ) {}

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

  @Post('data-engineer-chat')
  @ApiOperation({ summary: 'AX 데이터 엔지니어 자연어 몽고DB 검색' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', example: '미 디트로이트 현대기아 벤더사의 국내업체명과 이메일을 추출해 줘' },
      },
    },
  })
  async dataEngineerChat(@Body('query') query: string) {
    return this.agentService.chatDataEngineer(query);
  }

  @Sse('regional-consultant-stream')
  @ApiOperation({
    summary: '지역전문가 컨설턴트 (GTA MCP 관세·무역 규제 포함) 실시간 SSE 스트리밍',
  })
  @ApiQuery({ name: 'query', type: 'string', description: '질문 내용' })
  @ApiQuery({ name: 'region', type: 'string', required: false })
  @ApiQuery({ name: 'industry', type: 'string', required: false })
  regionalConsultantStream(
    @Query('query') query: string,
    @Query('region') region?: any,
    @Query('industry') industry?: string,
  ): Observable<MessageEvent> {
    return this.regionalConsultantService
      .runRegionalConsultant({ query, region, industry })
      .pipe(
        map(
          (event) =>
            ({
              data: event.data,
            }) as MessageEvent,
        ),
      );
  }

  @Post('regional-consultant')
  @ApiOperation({ summary: '지역전문가 컨설턴트 관세/무역 리포트 JSON 반환' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', example: '미국 수출 HS 8507.60 리튬이온배터리 관세율 및 IRA 규제 알려줘' },
        region: { type: 'string', example: 'latin_america' },
        industry: { type: 'string', example: '배터리' },
      },
    },
  })
  async regionalConsultant(@Body() body: { query: string; region?: any; industry?: string }) {
    return new Promise((resolve) => {
      const results: any[] = [];
      const sub = this.regionalConsultantService.runRegionalConsultant(body).subscribe({
        next: (event) => {
          try {
            results.push(JSON.parse(event.data));
          } catch {
            results.push({ type: 'text', text: event.data });
          }
        },
        complete: () => {
          resolve({ success: true, events: results });
        },
        error: (err) => {
          resolve({ success: false, error: err.message, events: results });
        },
      });
    });
  }
}

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
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

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
}

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PartnersService } from '../partners/partners.service';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import * as readline from 'readline';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(private readonly partnersService: PartnersService) {}

  // 1. 기존 OpenAI 동기식 API (호환성 유지)
  async chatWithAgent(message: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new HttpException(
        'OpenAI API 키가 설정되지 않았습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const searchResult = await this.partnersService.search({ q: message, limit: 5 });
      const companiesInfo = searchResult.data.map(company => ({
        이름: company.name,
        산업군: company.industry,
        설명: company.profileText || company.description || '',
        태그: company.tags || [],
      }));

      const systemPrompt = `당신은 K-Statra B2B 매칭 플랫폼의 친절하고 전문적인 AI 비서입니다.
사용자의 질문에 대해, 제공된 K-Statra DB의 회사 목록 데이터를 바탕으로 가장 적합한 회사를 추천하고 설명해주세요.
답변은 전문적이고 읽기 쉽게 작성해야 합니다.
데이터에 관련 회사가 없다면, 데이터에 없다고 솔직하게 답변하세요.

[검색된 K-Statra 파트너 데이터]
${JSON.stringify(companiesInfo, null, 2)}
`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      const isOpenRouter = process.env.OPENROUTER_API_KEY ? true : false;
      const url = isOpenRouter 
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const response = await axios.post(
        url,
        {
          model: 'gpt-4o',
          messages,
          temperature: 0.5,
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        answer: response.data.choices[0].message.content,
        data_source: 'K-Statra DB + Azure AI Agent',
        companies_found: companiesInfo.length
      };

    } catch (error: any) {
      this.logger.error(`Azure AI Agent Error: ${error.message}`);
      throw new HttpException(
        `AI 에이전트 오류: ${error.response?.data?.error?.message || error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. 프리미엄 Claude Managed Agent SSE 실시간 스트리밍 구현
  chatWithClaudeAgentStream(message: string, historyJson?: string): Observable<any> {
    const subject = new Subject<any>();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      setTimeout(() => {
        subject.next({ data: JSON.stringify({ type: 'error', text: 'Anthropic API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.' }) });
        subject.complete();
      }, 10);
      return subject.asObservable();
    }

    let history: any[] = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch (err) {
        this.logger.warn(`Failed to parse message history: ${err.message}`);
      }
    }

    const systemPrompt = `당신은 K-Statra B2B 매칭 플랫폼의 친절하고 스마트한 대표 AI 에이전트 Hermes(헤르메스)입니다.
사용자에게 가장 적합한 비즈니스 파트너(기업)를 추천하고 플랫폼 안내 및 컨설팅 질문에 정성껏 답변해 주세요.
반드시 마크다운(Markdown) 형식을 사용하여 단락, 글머리 기호, 굵은 글씨 등을 적용해 답변을 보기 좋고 세련되게 꾸며야 합니다.

만약 사용자가 특정 조건이나 비즈니스 파트너(수출업체, 제조업체 등)를 추천해 달라고 하면, 
주저하지 말고 반드시 제공된 도구인 'search_partners'를 호출하여 실시간으로 데이터베이스에서 검색한 뒤 그 신뢰할 수 있는 데이터에 기반하여 정밀하게 추천해야 합니다.
직접 지어내어 거짓 회사를 알려주면 절대 안 됩니다. 도구로 검색된 회사가 없다면 솔직히 없다고 말하고, 다른 키워드로 검색을 유도하거나 일반적인 컨설팅을 제공하세요.`;

    const tools = [
      {
        name: 'search_partners',
        description: 'K-Statra 파트너 데이터베이스에서 매칭이 필요한 비즈니스 파트너(기업) 목록을 실시간으로 검색합니다.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: '사용자가 검색하려는 키워드나 비즈니스 업종, 매칭 분야 (예: 자동차 부품 수출, 바이오 헬스케어)',
            },
          },
          required: ['query'],
        },
      },
    ];

    // 비동기 파싱 처리 실행
    (async () => {
      try {
        let currentMessages = [...history, { role: 'user', content: message }];

        subject.next({ data: JSON.stringify({ type: 'status', text: 'Hermes 에이전트 연결 중...' }) });

        // 첫 번째 API 호출 (도구 사용 여부 탐색)
        const response = await axios.post(
          'https://api.anthropic.com/v1/messages',
          {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: systemPrompt,
            messages: currentMessages,
            tools,
            stream: true,
          },
          {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            responseType: 'stream',
          }
        );

        const rl = readline.createInterface({
          input: response.data,
          terminal: false,
        });

        let toolUseBlock: any = null;
        let toolInputRaw = '';
        let assistantMessageContent: any[] = [];
        let textResponse = '';

        for await (const line of rl) {
          if (!line.trim() || !line.startsWith('data:')) continue;
          
          let parsed;
          try {
            parsed = JSON.parse(line.substring(5).trim());
          } catch (e) {
            continue;
          }

          if (parsed.type === 'content_block_start') {
            if (parsed.content_block?.type === 'tool_use') {
              toolUseBlock = parsed.content_block;
              toolInputRaw = '';
              subject.next({ data: JSON.stringify({ type: 'status', text: '데이터베이스에서 관련 비즈니스 파트너 검색 중...' }) });
            }
          } else if (parsed.type === 'content_block_delta') {
            const delta = parsed.delta;
            if (delta?.type === 'text_delta') {
              textResponse += delta.text;
              assistantMessageContent.push({ type: 'text', text: delta.text });
              subject.next({ data: JSON.stringify({ type: 'text', text: delta.text }) });
            } else if (delta?.type === 'input_json_delta') {
              toolInputRaw += delta.partial_json;
            }
          } else if (parsed.type === 'message_stop') {
            // 스트림 종료됨
          }
        }

        // 도구 사용이 감지된 경우 처리
        if (toolUseBlock) {
          let toolInput: any = {};
          try {
            toolInput = JSON.parse(toolInputRaw || '{}');
          } catch (err) {
            this.logger.error(`Failed to parse tool input: ${toolInputRaw}`);
          }

          const query = toolInput.query || message;
          this.logger.log(`Claude requested tool: search_partners with query: "${query}"`);
          
          subject.next({ data: JSON.stringify({ type: 'status', text: `"${query}" 관련 기업 데이터를 불러오고 있습니다...` }) });

          // 1. 로컬 파트너 검색 실행
          const searchResult = await this.partnersService.search({ q: query, limit: 5 });
          const companiesInfo = searchResult.data.map(company => ({
            name: company.name,
            industry: company.industry,
            description: company.profileText || company.description || '',
            tags: company.tags || [],
            location: company.location || '',
            sizeBucket: company.sizeBucket || '',
          }));

          subject.next({
            data: JSON.stringify({
              type: 'companies',
              companies: companiesInfo,
            }),
          });

          // 2. 도구 결과 메시지 구성
          assistantMessageContent.push({
            type: 'tool_use',
            id: toolUseBlock.id,
            name: toolUseBlock.name,
            input: toolInput,
          });

          const toolResultMessage = {
            role: 'user',
            content: [
              ...currentMessages,
              {
                role: 'assistant',
                content: assistantMessageContent,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify(companiesInfo),
                  },
                ],
              },
            ],
          };

          // 3. 도구 결과와 함께 2차 호출 실행하여 최종 답변 받기
          subject.next({ data: JSON.stringify({ type: 'status', text: '매칭 파트너를 분석하여 답변을 구성하고 있습니다...' }) });

          const finalResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2000,
              system: systemPrompt,
              messages: [
                ...currentMessages,
                {
                  role: 'assistant',
                  content: assistantMessageContent,
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: toolUseBlock.id,
                      content: JSON.stringify(companiesInfo),
                    },
                  ],
                },
              ],
              stream: true,
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              responseType: 'stream',
            }
          );

          const finalRl = readline.createInterface({
            input: finalResponse.data,
            terminal: false,
          });

          for await (const line of finalRl) {
            if (!line.trim() || !line.startsWith('data:')) continue;
            
            let parsed;
            try {
              parsed = JSON.parse(line.substring(5).trim());
            } catch (e) {
              continue;
            }

            if (parsed.type === 'content_block_delta') {
              const delta = parsed.delta;
              if (delta?.type === 'text_delta') {
                subject.next({ data: JSON.stringify({ type: 'text', text: delta.text }) });
              }
            }
          }
        }

        subject.complete();
      } catch (err: any) {
        this.logger.error(`Claude Streaming Agent Error: ${err.message}`);
        subject.next({
          data: JSON.stringify({
            type: 'error',
            text: `에이전트 오류가 발생했습니다: ${err.response?.data?.error?.message || err.message}`,
          }),
        });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }
}


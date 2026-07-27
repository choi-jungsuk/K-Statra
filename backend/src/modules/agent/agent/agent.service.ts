import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { PartnersService } from '../../partners/partners.service';
import axios from 'axios';
import { Observable, Subject } from 'rxjs';
import * as readline from 'readline';
import { getOpenAIChatModel } from '../../../config/openai-models';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly partnersService: PartnersService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

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
      const searchResult = await this.partnersService.search({
        q: message,
        limit: 5,
      });
      const companiesInfo = searchResult.data.map((company) => ({
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
        { role: 'user', content: message },
      ];

      const isOpenRouter = process.env.OPENROUTER_API_KEY ? true : false;
      const url = isOpenRouter
        ? 'https://openrouter.ai/api/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

      const response = await axios.post(
        url,
        {
          model: getOpenAIChatModel(),
          messages,
          temperature: 0.5,
          max_tokens: 1000,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const reply = response.data.choices[0].message.content;
      return { reply, recommendedPartners: searchResult.data };
    } catch (error: any) {
      this.logger.error(
        `OpenAI Chat API Error: ${error.response?.data?.error?.message || error.message}`,
      );
      throw new HttpException(
        'AI 응답을 생성하는 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // 2. 프리미엄 Claude Managed Agent SSE 실시간 스트리밍 구현 (원본 시그니처 및 로직 보존)
  chatWithClaudeAgentStream(
    message: string,
    historyJson?: string,
  ): Observable<any> {
    const subject = new Subject<any>();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      setTimeout(() => {
        subject.next({
          data: JSON.stringify({
            type: 'error',
            text: 'Anthropic API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
          }),
        });
        subject.complete();
      }, 10);
      return subject.asObservable();
    }

    let history: any[] = [];
    if (historyJson) {
      try {
        history = JSON.parse(historyJson);
      } catch (err: any) {
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
        description:
          'K-Statra 파트너 데이터베이스에서 매칭이 필요한 비즈니스 파트너(기업) 목록을 실시간으로 검색합니다.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description:
                '사용자가 검색하려는 키워드나 비즈니스 업종, 매칭 분야 (예: 자동차 부품 수출, 바이오 헬스케어)',
            },
            limit: {
              type: 'number',
              description: '검색할 최대 파트너 수 (기본값: 5, 최대: 10)',
            },
          },
          required: ['query'],
        },
      },
    ];

    (async () => {
      try {
        subject.next({
          data: JSON.stringify({
            type: 'status',
            text: 'Hermes 에이전트 가동 중 (Claude 3.5 Sonnet)...',
          }),
        });

        const messages: any[] = [
          ...history.map((h) => ({
            role: h.role === 'assistant' ? 'assistant' : 'user',
            content:
              typeof h.content === 'string'
                ? h.content
                : JSON.stringify(h.content),
          })),
          { role: 'user', content: message },
        ];

        let continueLoop = true;
        let loopCount = 0;

        while (continueLoop && loopCount < 5) {
          loopCount++;
          const response = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
              model: 'claude-3-5-sonnet-20241022',
              max_tokens: 2048,
              temperature: 0.5,
              system: systemPrompt,
              tools,
              messages,
              stream: true,
            },
            {
              headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              responseType: 'stream',
            },
          );

          const rl = readline.createInterface({
            input: response.data,
            terminal: false,
          });

          let currentToolUse: any = null;
          let toolInputJson = '';
          let stopReason: string | null = null;
          let assistantContentBlocks: any[] = [];

          for await (const line of rl) {
            const cleaned = line.trim();
            if (!cleaned || !cleaned.startsWith('data:')) continue;
            const dataStr = cleaned.substring(5).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'content_block_start') {
                if (event.content_block?.type === 'tool_use') {
                  currentToolUse = {
                    id: event.content_block.id,
                    name: event.content_block.name,
                  };
                  toolInputJson = '';
                }
              } else if (event.type === 'content_block_delta') {
                if (event.delta?.type === 'text_delta') {
                  subject.next({
                    data: JSON.stringify({
                      type: 'text',
                      text: event.delta.text,
                    }),
                  });
                } else if (event.delta?.type === 'input_json_delta') {
                  toolInputJson += event.delta.partial_json;
                }
              } else if (event.type === 'content_block_stop') {
                if (currentToolUse) {
                  let parsedArgs = {};
                  try {
                    parsedArgs = JSON.parse(toolInputJson);
                  } catch (e) {}
                  assistantContentBlocks.push({
                    type: 'tool_use',
                    id: currentToolUse.id,
                    name: currentToolUse.name,
                    input: parsedArgs,
                  });
                  currentToolUse = null;
                }
              } else if (event.type === 'message_delta') {
                stopReason = event.delta?.stop_reason;
              }
            } catch (e) {}
          }

          if (stopReason === 'tool_use' && assistantContentBlocks.length > 0) {
            messages.push({
              role: 'assistant',
              content: assistantContentBlocks,
            });

            const toolResults: any[] = [];
            for (const block of assistantContentBlocks) {
              if (block.type === 'tool_use' && block.name === 'search_partners') {
                subject.next({
                  data: JSON.stringify({
                    type: 'status',
                    text: `K-Statra DB에서 '${block.input.query}' 관련 비즈니스 파트너 검색 중...`,
                  }),
                });

                const searchResult = await this.partnersService.search({
                  q: block.input.query,
                  limit: block.input.limit || 5,
                });

                const companiesInfo = searchResult.data.map((company) => ({
                  name: company.name,
                  industry: company.industry,
                  description:
                    company.profileText || company.description || '',
                  tags: company.tags || [],
                  location: company.location
                    ? `${company.location.city || ''} ${company.location.country || ''}`.trim()
                    : '',
                  sizeBucket: company.sizeBucket || '',
                }));

                subject.next({
                  data: JSON.stringify({
                    type: 'companies',
                    companies: companiesInfo,
                  }),
                });

                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: block.id,
                  content: JSON.stringify(companiesInfo),
                });
              }
            }

            messages.push({
              role: 'user',
              content: toolResults,
            });
          } else {
            continueLoop = false;
          }
        }

        subject.complete();
      } catch (error: any) {
        this.logger.error(
          `Claude Managed Agent Error: ${error.response?.data?.error?.message || error.message}`,
        );
        this.streamWithOpenAI(message, history, subject);
      }
    })();

    return subject.asObservable();
  }

  // 3. OpenAI Fallback 스트리밍
  private async streamWithOpenAI(
    message: string,
    history: any[],
    subject: Subject<any>,
  ) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      subject.next({
        data: JSON.stringify({
          type: 'error',
          text: 'AI 서비스가 준비되지 않았습니다. API Key를 확인하세요.',
        }),
      });
      subject.complete();
      return;
    }

    try {
      subject.next({
        data: JSON.stringify({
          type: 'status',
          text: 'Hermes 에이전트 가동 중 (OpenAI 백업가동)...',
        }),
      });

      const searchResult = await this.partnersService.search({
        q: message,
        limit: 5,
      });
      const companiesInfo = searchResult.data.map((company) => ({
        name: company.name,
        industry: company.industry,
        description: company.profileText || company.description || '',
        tags: company.tags || [],
        location: company.location
          ? `${company.location.city || ''} ${company.location.country || ''}`.trim()
          : '',
        sizeBucket: company.sizeBucket || '',
      }));

      if (companiesInfo.length > 0) {
        subject.next({
          data: JSON.stringify({
            type: 'companies',
            companies: companiesInfo,
          }),
        });
      }

      const systemPrompt = `당신은 K-Statra B2B 매칭 플랫폼의 친절하고 스마트한 대표 AI 에이전트 Hermes(헤르메스)입니다.
사용자에게 가장 적합한 비즈니스 파트너(기업)를 추천하고 플랫폼 안내 및 컨설팅 질문에 정성껏 답변해 주세요.
반드시 마크다운(Markdown) 형식을 사용하여 단락, 글머리 기호, 굵은 글씨 등을 적용해 답변을 보기 좋고 세련되게 꾸며야 합니다.

[실시간 데이터베이스 검색된 파트너 목록]
${JSON.stringify(companiesInfo, null, 2)}

위 파트너 목록 데이터를 바탕으로 사용자의 매칭 요청에 부합하는 기업을 정성껏 추천하고 답변해 주세요. 데이터에 없거나 적절하지 않다면, 검색 결과가 충분하지 않음을 솔직하게 밝히고 다른 추천을 제공하세요.`;

      const openAIMessages = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role === 'assistant' ? 'assistant' : 'user',
          content:
            typeof h.content === 'string'
              ? h.content
              : JSON.stringify(h.content),
        })),
        { role: 'user', content: message },
      ];

      subject.next({
        data: JSON.stringify({
          type: 'status',
          text: '매칭 파트너를 분석하여 답변을 구성하고 있습니다...',
        }),
      });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: getOpenAIChatModel(),
          messages: openAIMessages,
          temperature: 0.5,
          max_tokens: 1500,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      const rl = readline.createInterface({
        input: response.data,
        terminal: false,
      });

      for await (const line of rl) {
        const cleaned = line.trim();
        if (!cleaned || cleaned === 'data: [DONE]') continue;
        if (cleaned.startsWith('data:')) {
          try {
            const parsed = JSON.parse(cleaned.substring(5).trim());
            const text = parsed.choices?.[0]?.delta?.content;
            if (text) {
              subject.next({ data: JSON.stringify({ type: 'text', text }) });
            }
          } catch {
            // ignore JSON chunk errors
          }
        }
      }

      subject.complete();
    } catch (error: any) {
      this.logger.error(`OpenAI Fallback Error: ${error.message}`);
      subject.next({
        data: JSON.stringify({
          type: 'error',
          text: `에이전트 통신 오류가 발생했습니다: ${error.response?.data?.error?.message || error.message}`,
        }),
      });
      subject.complete();
    }
  }

  // 4. AX Data Engineer: Natural language to MongoDB Query (KAICA 지원 및 안전한 fallback 완비)
  async chatDataEngineer(query: string): Promise<any> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new HttpException('OpenAI API 키가 설정되지 않았습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    try {
      const systemPrompt = [
        'You are a MongoDB expert query generator for K-Statra companies collection.',
        'The collection documents have these EXACT fields:',
        '- name: string (Korean company name)',
        '- nameEn: string (English company name)',
        '- industry: string (Industry/Category)',
        '- profileText: string (Company description and overview)',
        '- tags: array of strings',
        '- location.country: string',
        '',
        'CRITICAL RULE: For Korean/English keywords, extract the core root noun or acronym (e.g., use "IT|월드|WIS|2025" for "2025 월드 IT 쇼", "KAICA|협동조합" for "KAICA(협동조합)") for regex to match all variations.',
        'Convert the user natural language query into a valid MongoDB filter object (JSON).',
        'Example 1: "2025 월드 IT 쇼 참가업체 리스트" -> {"$or": [{"name": {"$regex": "IT|월드|WIS|2025", "$options": "i"}}, {"industry": {"$regex": "IT|월드|WIS|2025", "$options": "i"}}, {"profileText": {"$regex": "IT|월드|WIS|2025", "$options": "i"}}, {"tags": {"$regex": "IT|월드|WIS|2025", "$options": "i"}}]}',
        'Example 2: "KAICA(협동조합) 업체 리스트" -> {"$or": [{"name": {"$regex": "KAICA|협동조합", "$options": "i"}}, {"industry": {"$regex": "KAICA|협동조합", "$options": "i"}}, {"profileText": {"$regex": "KAICA|협동조합", "$options": "i"}}, {"tags": {"$regex": "KAICA|협동조합", "$options": "i"}}]}',
        'Example 3: "국내 업체 중 화장품 찾아줘" -> {"$or": [{"name": {"$regex": "화장품", "$options": "i"}}, {"industry": {"$regex": "화장품", "$options": "i"}}, {"profileText": {"$regex": "화장품", "$options": "i"}}, {"tags": {"$regex": "화장품", "$options": "i"}}]}',
        'Example 4: "미 디트로이트 현대기아 벤더사" -> {"$or": [{"name": {"$regex": "디트로이트|현대|기아|벤더", "$options": "i"}}, {"industry": {"$regex": "디트로이트|현대|기아|벤더", "$options": "i"}}, {"profileText": {"$regex": "디트로이트|현대|기아|벤더", "$options": "i"}}, {"tags": {"$regex": "디트로이트|현대|기아|벤더", "$options": "i"}}]}',
        '',
        'ONLY RETURN THE JSON OBJECT. No markdown, no explanations. Make sure it is valid JSON.'
      ].join('\n');

      const isOpenRouter = process.env.OPENROUTER_API_KEY ? true : false;
      const url = isOpenRouter ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';

      const response = await axios.post(url, {
        model: getOpenAIChatModel(),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0,
      }, {
        headers: { Authorization: "Bearer " + apiKey, 'Content-Type': 'application/json' },
      });

      let filterJson = response.data.choices[0].message.content.trim();
      filterJson = filterJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let filter: Record<string, any> = {};
      try {
        filter = JSON.parse(filterJson);
      } catch (parseErr) {
        const cleanKeyword = query.replace(/(업체|참가업체|리스트|엑셀|파일|정리|해줘|찾아줘|추출|출력)/g, '').trim();
        const terms = cleanKeyword.split(/\s+/).filter(Boolean).join('|');
        filter = {
          $or: [
            { name: { $regex: terms || cleanKeyword, $options: 'i' } },
            { nameEn: { $regex: terms || cleanKeyword, $options: 'i' } },
            { industry: { $regex: terms || cleanKeyword, $options: 'i' } },
            { profileText: { $regex: terms || cleanKeyword, $options: 'i' } },
            { tags: { $regex: terms || cleanKeyword, $options: 'i' } },
          ],
        };
      }

      this.logger.log('Generated filter: ' + JSON.stringify(filter));
      
      let companies = await this.connection.collection('companies').find(filter).limit(300).toArray();

      // 만약 정규식으로도 0건이면 키워드 단어별 이중 Fallback 검색 시도
      if (!companies || companies.length === 0) {
        const cleanKeyword = query.replace(/(업체|참가업체|리스트|엑셀|파일|정리|해줘|찾아줘|추출|출력)/g, '').trim();
        const terms = cleanKeyword.split(/\s+/).filter(Boolean).join('|');
        const fallbackFilter = {
          $or: [
            { name: { $regex: terms || cleanKeyword, $options: 'i' } },
            { nameEn: { $regex: terms || cleanKeyword, $options: 'i' } },
            { industry: { $regex: terms || cleanKeyword, $options: 'i' } },
            { profileText: { $regex: terms || cleanKeyword, $options: 'i' } },
            { tags: { $regex: terms || cleanKeyword, $options: 'i' } },
          ],
        };
        companies = await this.connection.collection('companies').find(fallbackFilter).limit(300).toArray();
      }

      const answer = "요청하신 조건에 일치하는 업체 " + companies.length + "건을 찾았습니다. 아래 미리보기 표 및 대화창 하단의 [📊 엑셀 다운로드] 또는 [📄 PDF 다운로드] 버튼을 눌러 바로 내보내실 수 있습니다.";
      
      return { message: answer, data: companies };
    } catch (error: any) {
      this.logger.error("Data Engineer Chat Error: " + error.message);
      try {
        const cleanKeyword = query.replace(/(업체|참가업체|리스트|엑셀|파일|정리|해줘|찾아줘|추출|출력)/g, '').trim();
        const terms = cleanKeyword.split(/\s+/).filter(Boolean).join('|');
        const filter = {
          $or: [
            { name: { $regex: terms || cleanKeyword, $options: 'i' } },
            { nameEn: { $regex: terms || cleanKeyword, $options: 'i' } },
            { industry: { $regex: terms || cleanKeyword, $options: 'i' } },
            { profileText: { $regex: terms || cleanKeyword, $options: 'i' } },
            { tags: { $regex: terms || cleanKeyword, $options: 'i' } },
          ],
        };
        const companies = await this.connection.collection('companies').find(filter).limit(300).toArray();
        const answer = `요청하신 키워드("${cleanKeyword}") 관련 업체 ${companies.length}건을 찾았습니다. 아래 대화창 하단의 [📊 엑셀 다운로드] 또는 [📄 PDF 다운로드] 버튼을 눌러 바로 저장하실 수 있습니다.`;
        return { message: answer, data: companies };
      } catch (fallbackErr) {
        return { message: '데이터 검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', data: [] };
      }
    }
  }
}

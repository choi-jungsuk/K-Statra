import {
  getOpenAIChatModel,
  getOpenAIFastModel,
  getOpenAIAxProfileModel,
  getOpenAIReportModel,
} from './openai-models';

describe('OpenAI model config helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.OPENAI_CHAT_MODEL;
    delete process.env.OPENAI_FAST_MODEL;
    delete process.env.OPENAI_AX_PROFILE_MODEL;
    delete process.env.OPENAI_REPORT_MODEL;
    delete process.env.GPT_MODEL_ID;
    delete process.env.OPENAI_MODEL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('용도별 기본 모델을 제공한다', () => {
    expect(getOpenAIChatModel()).toBe('gpt-4o');
    expect(getOpenAIFastModel()).toBe('gpt-4o-mini');
    expect(getOpenAIAxProfileModel()).toBe('gpt-4o');
    expect(getOpenAIReportModel()).toBe('gpt-4o');
  });

  it('용도별 환경변수가 있으면 우선 사용한다', () => {
    process.env.OPENAI_CHAT_MODEL = 'gpt-chat-custom';
    process.env.OPENAI_FAST_MODEL = 'gpt-fast-custom';
    process.env.OPENAI_AX_PROFILE_MODEL = 'gpt-ax-custom';
    process.env.OPENAI_REPORT_MODEL = 'gpt-report-custom';

    expect(getOpenAIChatModel()).toBe('gpt-chat-custom');
    expect(getOpenAIFastModel()).toBe('gpt-fast-custom');
    expect(getOpenAIAxProfileModel()).toBe('gpt-ax-custom');
    expect(getOpenAIReportModel()).toBe('gpt-report-custom');
  });

  it('기존 GPT_MODEL_ID와 OPENAI_MODEL은 하위 호환 fallback으로 사용한다', () => {
    process.env.GPT_MODEL_ID = 'gpt-legacy-chat';
    process.env.OPENAI_MODEL = 'gpt-legacy-openai';

    expect(getOpenAIChatModel()).toBe('gpt-legacy-chat');
    expect(getOpenAIAxProfileModel()).toBe('gpt-legacy-openai');
    expect(getOpenAIReportModel()).toBe('gpt-legacy-openai');
  });
});

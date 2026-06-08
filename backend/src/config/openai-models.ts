export function getOpenAIChatModel(): string {
  return process.env.OPENAI_CHAT_MODEL || process.env.GPT_MODEL_ID || 'gpt-4o';
}

export function getOpenAIFastModel(): string {
  return process.env.OPENAI_FAST_MODEL || 'gpt-4o-mini';
}

export function getOpenAIAxProfileModel(): string {
  return (
    process.env.OPENAI_AX_PROFILE_MODEL || process.env.OPENAI_MODEL || 'gpt-4o'
  );
}

export function getOpenAIReportModel(): string {
  return (
    process.env.OPENAI_REPORT_MODEL || process.env.OPENAI_MODEL || 'gpt-4o'
  );
}

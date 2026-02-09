import { streamText } from 'ai';

const AI_MODEL = process.env.AI_MODEL || 'openai/gpt-5.2';
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || '';

export function isAiGatewayConfigured(): boolean {
  return Boolean(AI_GATEWAY_API_KEY && AI_MODEL);
}

export async function runAI(prompt: string): Promise<string> {
  if (!AI_GATEWAY_API_KEY) {
    throw new Error('AI Gateway not configured: AI_GATEWAY_API_KEY is missing.');
  }

  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    throw new Error('Prompt is required.');
  }

  const result = await streamText({
    model: AI_MODEL,
    prompt: trimmed,
    headers: {
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
    },
  });

  // Vercel AI SDK exposes the full text on result.text
  if (typeof (result as any).text === 'string') {
    return (result as any).text as string;
  }

  // Fallback: concatenate chunks if text accessor is not present
  let fullText = '';
  // eslint-disable-next-line no-restricted-syntax
  for await (const chunk of (result as any).stream ?? []) {
    const content = (chunk as any).content;
    if (typeof content === 'string') {
      fullText += content;
    }
  }

  if (!fullText) {
    throw new Error('AI Gateway returned an empty response.');
  }

  return fullText;
}


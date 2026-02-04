/**
 * Open-source embeddings helper (Hugging Face or compatible encoder endpoint).
 *
 * Configure:
 * - HF_API_URL
 * - HF_API_TOKEN
 * - HF_EMBED_MODEL (e.g. sentence-transformers/all-MiniLM-L6-v2)
 */

const HF_EMBED_URL = (process.env.HF_API_URL || 'https://api-inference.huggingface.co/models').replace(/\/+$/, '');
const HF_EMBED_MODEL = process.env.HF_EMBED_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
const HF_EMBED_TOKEN = process.env.HF_API_TOKEN || '';

export async function embedText(texts: string[]): Promise<number[][]> {
  const res = await fetch(`${HF_EMBED_URL}/${encodeURIComponent(HF_EMBED_MODEL)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(HF_EMBED_TOKEN ? { Authorization: `Bearer ${HF_EMBED_TOKEN}` } : {}),
    },
    body: JSON.stringify({ inputs: texts }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Embedding error ${res.status}: ${msg}`);
  }

  const data = (await res.json()) as unknown;

  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data as number[][];
  }
  if (Array.isArray(data)) {
    return [data as number[]];
  }
  throw new Error('Unexpected embedding response');
}


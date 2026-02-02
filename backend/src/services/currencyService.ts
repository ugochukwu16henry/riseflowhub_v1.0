/**
 * Currency conversion using ExchangeRate-API open access (no key).
 * https://open.er-api.com/v6/latest/USD
 * Cache for 1 hour to respect rate limits.
 */

const CACHE_MS = 60 * 60 * 1000; // 1 hour
let cached: { rates: Record<string, number>; at: number } | null = null;

export async function getUsdToCurrencyRate(currency: string): Promise<number> {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  if (code === 'USD') return 1;
  if (cached && Date.now() - cached.at < CACHE_MS && cached.rates[code] != null) {
    return cached.rates[code];
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as { result?: string; rates?: Record<string, number> };
    if (data.result !== 'success' || !data.rates) return 1;
    cached = { rates: data.rates, at: Date.now() };
    return data.rates[code] ?? 1;
  } catch {
    return 1;
  }
}

export async function convertUsdToCurrency(usdAmount: number, currency: string): Promise<{ amount: number; currency: string; rate: number }> {
  const rate = await getUsdToCurrencyRate(currency);
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  return {
    amount: Math.round(usdAmount * rate * 100) / 100,
    currency: code,
    rate,
  };
}

/** Convert amount in given currency to USD (for audit/reports). */
export async function convertToUsd(amount: number, currency: string): Promise<number> {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  if (code === 'USD') return amount;
  const rate = await getUsdToCurrencyRate(code);
  return rate && rate > 0 ? Math.round((amount / rate) * 100) / 100 : amount;
}

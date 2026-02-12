export interface X402PaymentRequirement {
  to: string;
  amount: string;          // human-readable (e.g. "0.01")
  rawAmount: string;       // original from 402 response (e.g. "10000")
  token: string;
  tokenSymbol: string;
  network: string;
  description: string;
  scheme: string;          // e.g. "exact"
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}

export interface X402VerifiedResponse {
  message: string;
  tx_hash: string;
  solscan: string;
  content: Record<string, unknown>;
}

const DEFAULT_ENDPOINT = 'https://x402.payai.network/api/solana-devnet/paid-content';

// Use the Supabase edge function as proxy to preserve custom headers
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function proxyFetch(url: string, paymentSignature?: string): Promise<Response> {
  const proxyUrl = `${SUPABASE_URL}/functions/v1/x402-proxy`;

  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      url,
      ...(paymentSignature ? { paymentSignature } : {}),
    }),
  });

  return res;
}

export async function fetchX402Requirements(
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402PaymentRequirement> {
  const res = await proxyFetch(url);
  const data = await res.json();
  const upstreamStatus = data?.upstreamStatus || res.status;

  if (!data?.x402 && !data?.accepts && upstreamStatus !== 402) {
    throw new Error(`Expected x402 payment data, got ${upstreamStatus}: ${JSON.stringify(data).slice(0, 200)}`);
  }

  const accepts = data?.x402?.accepts || data?.accepts;

  if (!accepts || !Array.isArray(accepts) || accepts.length === 0) {
    throw new Error('No payment options returned from x402 endpoint');
  }

  const usdcOption = accepts.find(
    (a: any) => a.tokenSymbol === 'USDC' || a.asset || (a.token && a.token !== 'native')
  );
  const option = usdcOption || accepts[0];

  const to = option.payTo || option.to;
  const token = option.asset || option.token;
  const description = option.extra?.description || option.description || '';
  const rawAmount = String(option.amount);

  // Convert raw amount (e.g. "10000" with 6 decimals = 0.01) to human-readable
  let amount = rawAmount;
  if (amount && /^\d+$/.test(amount) && !amount.includes('.')) {
    amount = (Number(amount) / 1_000_000).toString();
  }

  return {
    to,
    amount,
    rawAmount,
    token,
    tokenSymbol: option.tokenSymbol || 'USDC',
    network: option.network || data?.x402?.network || 'solana-devnet',
    description,
    scheme: option.scheme || 'exact',
    maxTimeoutSeconds: option.maxTimeoutSeconds || 60,
    extra: option.extra || {},
  };
}

/**
 * Build the x402 v2 Payment-Signature header value.
 * Base64-encoded JSON matching the exact v2 spec.
 */
export function buildX402PaymentHeader(
  signedTxBase64: string,
  paymentReq: X402PaymentRequirement,
  resourceUrl: string
): string {
  const payload = {
    x402Version: 2,
    resource: {
      url: resourceUrl,
      description: paymentReq.description,
      mimeType: 'application/json',
    },
    accepted: {
      scheme: paymentReq.scheme,
      network: paymentReq.network,
      amount: paymentReq.rawAmount,
      asset: paymentReq.token,
      payTo: paymentReq.to,
      maxTimeoutSeconds: paymentReq.maxTimeoutSeconds,
      extra: paymentReq.extra,
    },
    payload: {
      transaction: signedTxBase64,
    },
  };

  return btoa(JSON.stringify(payload));
}

/**
 * Send signed transaction to x402 facilitator via edge function proxy.
 * The facilitator co-signs and broadcasts — we do NOT broadcast locally.
 */
export async function verifyX402Payment(
  signedTxBase64: string,
  paymentReq: X402PaymentRequirement,
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402VerifiedResponse> {
  const paymentHeader = buildX402PaymentHeader(signedTxBase64, paymentReq, url);

  const res = await proxyFetch(url, paymentHeader);
  const data = await res.json();
  const upstreamStatus = data?.upstreamStatus || res.status;

  if (upstreamStatus < 200 || upstreamStatus >= 300) {
    throw new Error(
      data?.error || data?.hint || `Payment verification failed (${upstreamStatus}): ${JSON.stringify(data).slice(0, 300)}`
    );
  }

  return data as X402VerifiedResponse;
}

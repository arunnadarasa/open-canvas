export interface X402PaymentRequirement {
  to: string;
  amount: string;
  token: string;
  tokenSymbol: string;
  network: string;
  description: string;
}

export interface X402VerifiedResponse {
  message: string;
  tx_hash: string;
  solscan: string;
  content: Record<string, unknown>;
}

const DEFAULT_ENDPOINT = 'https://x402.payai.network/api/solana-devnet/paid-content';
const CORS_PROXY = 'https://corsproxy.io/?key=83d86fb9&url=';

function proxyUrl(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

export async function fetchX402Requirements(
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402PaymentRequirement> {
  const res = await fetch(proxyUrl(url));
  const data = await res.json();

  // Accept 402 (direct) or any response that contains x402 payment data (via proxy)
  if (!data?.x402 && res.status !== 402) {
    throw new Error(`Expected x402 payment data, got ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  // Support both v1 (data.x402.accepts) and v2 (data.accepts)
  const accepts = data?.x402?.accepts || data?.accepts;

  if (!accepts || !Array.isArray(accepts) || accepts.length === 0) {
    throw new Error('No payment options returned from x402 endpoint');
  }

  // Prefer USDC, fall back to first option
  const usdcOption = accepts.find(
    (a: any) => a.tokenSymbol === 'USDC' || a.asset || (a.token && a.token !== 'native')
  );
  const option = usdcOption || accepts[0];

  // Normalize v2 field names to internal format
  const to = option.payTo || option.to;
  const token = option.asset || option.token;
  const description = option.extra?.description || option.description || '';

  // Convert raw amount (e.g. "10000" with 6 decimals = 0.01) to human-readable
  let amount = option.amount;
  if (amount && /^\d+$/.test(amount) && !amount.includes('.')) {
    amount = (Number(amount) / 1_000_000).toString();
  }

  return {
    to,
    amount,
    token,
    tokenSymbol: option.tokenSymbol || 'USDC',
    network: option.network || data?.x402?.network || 'solana-devnet',
    description,
  };
}

export async function verifyX402Payment(
  txSignature: string,
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402VerifiedResponse> {
  const res = await fetch(proxyUrl(url), {
    headers: {
      'Payment-Signature': txSignature,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data?.error || data?.hint || `Payment verification failed (${res.status})`
    );
  }

  return data as X402VerifiedResponse;
}

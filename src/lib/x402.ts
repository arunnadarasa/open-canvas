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
const CORS_PROXY = 'https://corsproxy.io/?url=';

function proxyUrl(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

export async function fetchX402Requirements(
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402PaymentRequirement> {
  const res = await fetch(proxyUrl(url));

  if (res.status !== 402) {
    throw new Error(`Expected 402 response, got ${res.status}`);
  }

  const data = await res.json();
  const accepts = data?.x402?.accepts;

  if (!accepts || !Array.isArray(accepts) || accepts.length === 0) {
    throw new Error('No payment options returned from x402 endpoint');
  }

  // Prefer USDC, fall back to first option
  const usdcOption = accepts.find(
    (a: any) => a.tokenSymbol === 'USDC' || (a.token && a.token !== 'native')
  );
  const option = usdcOption || accepts[0];

  return {
    to: option.to,
    amount: option.amount,
    token: option.token,
    tokenSymbol: option.tokenSymbol || 'USDC',
    network: option.network || data?.x402?.network || 'solana-devnet',
    description: option.description || '',
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

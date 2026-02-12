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
const CORS_PROXY = 'https://corsproxy.io/?key=83d86fb9&url=';

function proxyUrl(url: string): string {
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

export async function fetchX402Requirements(
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402PaymentRequirement> {
  const res = await fetch(proxyUrl(url));
  const data = await res.json();

  if (!data?.x402 && res.status !== 402) {
    throw new Error(`Expected x402 payment data, got ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
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

export async function verifyX402Payment(
  signedTxBase64: string,
  paymentReq: X402PaymentRequirement,
  url: string = import.meta.env.VITE_X402_ENDPOINT || DEFAULT_ENDPOINT
): Promise<X402VerifiedResponse> {
  const paymentHeader = buildX402PaymentHeader(signedTxBase64, paymentReq, url);

  const res = await fetch(proxyUrl(url), {
    headers: {
      'PAYMENT-SIGNATURE': paymentHeader,
      'Payment-Signature': paymentHeader,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    if (data?.error?.includes('PAYMENT-SIGNATURE') || data?.hint?.includes('PAYMENT-SIGNATURE')) {
      const separator = url.includes('?') ? '&' : '?';
      const directUrl = `${url}${separator}payment_signature=${encodeURIComponent(paymentHeader)}`;
      const retryRes = await fetch(proxyUrl(directUrl), {
        headers: {
          'PAYMENT-SIGNATURE': paymentHeader,
          'Payment-Signature': paymentHeader,
        },
      });
      const retryData = await retryRes.json();
      if (!retryRes.ok) {
        throw new Error(
          retryData?.error || retryData?.hint || `Payment verification failed (${retryRes.status})`
        );
      }
      return retryData as X402VerifiedResponse;
    }

    throw new Error(
      data?.error || data?.hint || `Payment verification failed (${res.status})`
    );
  }

  return data as X402VerifiedResponse;
}

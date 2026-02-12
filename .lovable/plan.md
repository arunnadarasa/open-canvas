

## Fix Missing Solscan Link After x402 Payment

### Problem

The facilitator's response uses field names `transaction`, `transactionId`, and `signature` for the tx hash -- **not** `tx_hash`. The current code only checks `verified.tx_hash`, which is always `undefined`, so the Solscan link never renders.

Actual facilitator response (from logs):
```text
{
  "success": true,
  "transaction": "4cYzADoLz...",
  "transactionId": "4cYzADoLz...",
  "signature": "4cYzADoLz...",
  "network": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  "payer": "UjxYKRD5og...",
  "premiumContent": "Have some rizz!",
  ...
}
```

### Changes

**1. `src/lib/x402.ts` -- Update `X402VerifiedResponse` and `verifyX402Payment`**

- Expand the interface to include all possible tx hash field names (`transaction`, `transactionId`, `signature`)
- In `verifyX402Payment`, normalize the tx hash by checking all variants and returning a consistent `tx_hash` field
- Also capture `premiumContent` / other content fields

**2. `src/components/MoveMint.tsx` -- Fix tx hash extraction**

- Update the code at line 209 to also check `verified.transaction`, `verified.transactionId`, and `verified.signature` as fallbacks for the Solscan link

### Technical Details

Updated interface:
```text
export interface X402VerifiedResponse {
  tx_hash: string;        // normalized by our code
  solscan: string;
  message: string;
  content: Record<string, unknown>;
  // raw fields from facilitator
  transaction?: string;
  transactionId?: string;
  signature?: string;
  premiumContent?: string;
}
```

In `verifyX402Payment`, after parsing:
```text
const txHash = data.tx_hash || data.transaction || data.transactionId || data.signature;
return {
  ...data,
  tx_hash: txHash,
  solscan: `https://solscan.io/tx/${txHash}?cluster=devnet`,
} as X402VerifiedResponse;
```




## Integrate x402 Payment via PayAI Network

### What Changes
When the user clicks "Mint Move NFT", the app will first check the x402 endpoint for payment requirements, make the USDC payment, then verify it -- all before confirming the mint.

### Endpoint
`https://x402.payai.network/api/solana-devnet/paid-content`

This endpoint returns a 402 response with USDC payment details ($0.01 USDC on Solana Devnet). After payment, the app retries with the transaction signature to verify and unlock the content.

### Files to Create/Modify

**1. New: `src/lib/x402.ts`**
- `fetchX402Requirements(url)` -- calls the endpoint, parses the 402 JSON to extract payment details (recipient address, USDC amount, token mint)
- `verifyX402Payment(url, txSignature)` -- retries the endpoint with `Payment-Signature` header, returns the unlocked content on 200

**2. Update: `src/components/MoveMint.tsx`**
- Replace the hardcoded treasury PDA + 0.001 SOL transfer with the x402 flow:
  1. Call `fetchX402Requirements()` to get payment details
  2. Build a USDC SPL token transfer (not native SOL) to the returned recipient address
  3. Sign via Phantom, broadcast, get tx signature
  4. Call `verifyX402Payment()` with the signature
  5. On success, show verified status with Solscan link
- Add USDC token transfer logic using `@solana/spl-token` (already installed) to find/create associated token accounts and transfer
- Update status messages to reflect the x402 flow stages ("Fetching payment requirements...", "Paying $0.01 USDC...", "Verifying payment...")
- Keep the existing wallet connection and Ethereum detection UI unchanged

**3. Update: `.env.example`**
- Add `VITE_X402_ENDPOINT=https://x402.payai.network/api/solana-devnet/paid-content`

### Technical Flow

```text
User clicks Mint
  -> GET x402 endpoint
  -> 402 response: { to, amount: 0.01, token: USDC_MINT }
  -> Build SPL Token transfer (USDC) to recipient
  -> Phantom signs transaction
  -> Broadcast + confirm on devnet
  -> GET x402 endpoint + Payment-Signature header
  -> 200 response: content unlocked, mint confirmed
```

### Notes
- The USDC devnet mint address (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`) will be parsed from the 402 response
- Users need devnet USDC in their wallet -- the UI will show a helpful message if balance is insufficient
- Falls back gracefully if the x402 endpoint is unreachable

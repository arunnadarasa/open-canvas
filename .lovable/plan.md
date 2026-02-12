

## Two Changes: Fix x402 Verification + Add Native SOL Payment Option

### 1. Fix x402 Verification (it IS possible -- two bugs)

**Problem A: CORS proxy strips custom request headers.** The `Payment-Signature` header is being sent TO the proxy, but the proxy isn't forwarding it to the x402 endpoint. The response keeps saying "PAYMENT-SIGNATURE header is required" even though the header appears in the request.

**Problem B: Wrong header format.** The x402 v2 protocol expects a base64-encoded JSON payload in the `PAYMENT-SIGNATURE` header, not just a raw transaction signature. From the reference code, the payload should look like:

```text
base64({
  "x402Version": 2,
  "payload": { "transaction": "<signed_tx_base64>" },
  "resource": { "url": "...", "description": "..." },
  "accepted": { scheme, network, amount, asset, payTo, ... }
})
```

**Fix:** 
- In `src/lib/x402.ts`, update `verifyX402Payment` to build the proper x402 v2 payload and base64-encode it
- In `src/components/MoveMint.tsx`, pass the full payment requirement info and the serialized signed transaction (not just the on-chain signature) to the verification function
- The signed transaction needs to be captured before broadcasting and passed to the verification step

### 2. Add Native SOL Payment Option

Add a toggle/selector in the mint form so users can choose between paying with USDC (via x402) or native SOL (direct transfer).

**Changes to `src/components/MoveMint.tsx`:**
- Add a `paymentMethod` state: `'usdc'` or `'sol'`
- Add a toggle/radio selector in the form UI
- When `'sol'` is selected, build a simple `SystemProgram.transfer` instead of the SPL token transfer
- Convert the USDC amount to an equivalent SOL amount (hardcoded rate or use a simple conversion -- e.g., 0.01 USDC ~ 0.0001 SOL on devnet, since devnet SOL is free)
- SOL path skips x402 entirely -- just a direct transfer to the same recipient address
- Update the submit button label to reflect the selected method

**Changes to `src/lib/x402.ts`:**
- Update `verifyX402Payment` signature to accept the signed transaction bytes and payment requirements (not just tx signature)
- Build the proper x402 v2 `PAYMENT-SIGNATURE` header as base64-encoded JSON containing the signed transaction
- Store the payment requirements from `fetchX402Requirements` so they can be reused during verification

### Technical Details

**Files modified:**
- `src/lib/x402.ts` -- fix verification header format
- `src/components/MoveMint.tsx` -- pass correct data to verification, add SOL payment toggle and SystemProgram.transfer logic

**Verification flow (fixed):**
1. User signs the USDC transfer transaction
2. Before broadcasting, serialize the signed transaction to base64
3. Build x402 v2 payload with the signed transaction + accepted payment info
4. Base64-encode the payload and send as `PAYMENT-SIGNATURE` header directly to the x402 endpoint (not via CORS proxy for verification -- or pass the header as a query parameter if the proxy supports it)
5. If CORS proxy cannot forward custom headers reliably, we send the verification request with the header embedded in the proxy URL parameters

**SOL payment flow (new):**
1. User selects "Pay with SOL"
2. Build a `SystemProgram.transfer` for ~0.0001 SOL (devnet) to the same recipient
3. Sign with Phantom, broadcast, confirm
4. Skip x402 verification (not applicable for native SOL)
5. Mark as minted directly


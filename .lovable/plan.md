

## Fix x402 Protocol: Three Critical Bugs

The PAYMENT-SIGNATURE header payload structure looks correct now, but the **transaction itself and the submission flow** violate the x402 protocol. Here's the expert diagnosis and fix.

### Bug 1: Wrong Transaction Structure

The x402 protocol requires a specific 3-instruction transaction with the **facilitator** as fee payer, not the user. The facilitator address is provided in `extra.feePayer` (`2wKupLR9q6wXYppw8Gr2NvWxKBUqm4PPJKkQfoxHDBg4`).

**Current (broken):**
- 1 instruction: `createTransferInstruction` (owner-based SPL transfer)
- `feePayer` = user's wallet

**Required by x402 v2:**
- 3 instructions:
  1. `SetComputeUnitLimit(10000)` -- cap compute
  2. `SetComputeUnitPrice(1000)` -- priority fee in microLamports
  3. `TransferChecked(source ATA -> dest ATA, amount, 6 decimals)` -- USDC transfer with decimal verification
- `feePayer` = facilitator public key (from `extra.feePayer`)
- Serialized with `requireAllSignatures: false` (the facilitator co-signs later)

### Bug 2: User Should NOT Broadcast

The current code broadcasts the transaction on-chain via `sendRawTransaction`, then tries to verify with x402. This is backwards. In the x402 protocol:

1. User signs the transaction (partial -- only user's signature, not facilitator's)
2. User sends the signed-but-not-broadcast TX in the `PAYMENT-SIGNATURE` header
3. The **facilitator** verifies, co-signs, and broadcasts on-chain
4. The endpoint returns the verified content + tx hash

So the `sendRawTransaction` and `confirmTransaction` calls must be **removed** from the USDC flow.

### Bug 3: CORS Proxy Strips Headers

`corsproxy.io` does not forward the `PAYMENT-SIGNATURE` header to the origin. The header is sent to the proxy but never reaches `x402.payai.network`. A Supabase edge function will act as a proper proxy.

### Implementation Plan

**1. Create Supabase edge function `x402-proxy`**

A simple proxy that:
- Accepts POST with `{ url, paymentSignature }` in the body
- Forwards a GET request to `url` with `PAYMENT-SIGNATURE: paymentSignature` header
- Returns the response (200 with content, or error)

```text
POST /x402-proxy
Body: { "url": "https://x402.payai.network/...", "paymentSignature": "<base64>" }

Edge function does:
  GET url with header "PAYMENT-SIGNATURE: <base64>"
  Returns response JSON
```

**2. Update `src/lib/x402.ts`**

- `fetchX402Requirements`: Replace `corsproxy.io` with the edge function for the initial 402 fetch (or keep direct since 402 responses don't need custom headers -- but the edge function is cleaner)
- `verifyX402Payment`: Instead of fetching via CORS proxy with headers, POST to the edge function with the URL and payment signature in the body
- `buildX402PaymentHeader`: No changes needed (already correct)
- Remove the query-parameter fallback hack (no longer needed with proper proxy)

**3. Update `src/components/MoveMint.tsx` -- `mintWithUSDC` function**

Rewrite the USDC transaction construction:

```text
Step 1: fetchX402Requirements() -- same as now
Step 2: Build the correct 3-instruction transaction:
  - Import ComputeBudgetProgram from @solana/web3.js
  - Import createTransferCheckedInstruction from @solana/spl-token
  - Set feePayer = new PublicKey(paymentReq.extra.feePayer)
  - Add SetComputeUnitLimit(10000)
  - Add SetComputeUnitPrice(1000)
  - Add TransferChecked(senderATA, usdcMint, recipientATA, fromPubkey, amount, 6)
  - Serialize with requireAllSignatures: false
Step 3: Sign with Phantom (partial signature only)
Step 4: Serialize signed TX to base64
Step 5: Build PAYMENT-SIGNATURE header (already correct)
Step 6: Send to x402-proxy edge function (NOT broadcast on-chain)
Step 7: Edge function returns verified content + tx_hash from facilitator
Step 8: Display success with the facilitator-provided tx hash
```

- Remove `sendRawTransaction` and `confirmTransaction` from USDC flow
- The `txSignature` will come from the x402 verification response (`data.tx_hash`), not from local broadcast

**4. No changes to SOL flow**

The SOL direct payment path remains unchanged -- it correctly broadcasts on-chain since it doesn't use x402.

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/x402-proxy/index.ts` | **Create** -- Edge function proxy |
| `src/lib/x402.ts` | **Modify** -- Use edge function, fix verification flow |
| `src/components/MoveMint.tsx` | **Modify** -- Fix transaction structure, remove broadcast from USDC flow |

### Technical Details: Transaction Construction

```text
import { ComputeBudgetProgram } from '@solana/web3.js';
import { createTransferCheckedInstruction } from '@solana/spl-token';

const facilitatorPubkey = new PublicKey(paymentReq.extra.feePayer);

const transaction = new Transaction();
transaction.add(ComputeBudgetProgram.setComputeUnitLimit({ units: 10_000 }));
transaction.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000 }));
transaction.add(
  createTransferCheckedInstruction(
    senderATA,      // source ATA
    usdcMint,       // mint
    recipientATA,   // destination ATA
    fromPubkey,     // owner (signer)
    amount,         // amount in smallest unit
    6               // decimals for USDC
  )
);

transaction.recentBlockhash = blockhash;
transaction.feePayer = facilitatorPubkey;  // facilitator pays gas

const signedTx = await phantom.signTransaction(transaction);
// Serialize with requireAllSignatures: false (facilitator hasn't signed)
const serializedTx = signedTx.serialize({ requireAllSignatures: false });
const signedTxBase64 = Buffer.from(serializedTx).toString('base64');
```

### Expected Result

After these fixes, the USDC x402 flow will:
1. Present the correct 3-instruction transaction to Phantom for signing
2. NOT broadcast (the user doesn't need SOL for gas -- facilitator pays)
3. Send the signed TX via the edge function proxy with proper headers
4. Receive verified content from the x402 facilitator
5. Display the facilitator-provided transaction hash on Solscan


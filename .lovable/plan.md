

## Fix x402 Verification Header Format + Debug Panel

Based on the reference from your other Lovable app, the current `buildX402PaymentHeader` is close but missing key fields. Also, the status shows `[object Object]` -- a display bug.

### Changes

**1. Update `src/lib/x402.ts`**

- Store the **raw** accepts option from the 402 response (scheme, maxTimeoutSeconds, extra) alongside normalized fields
- Update `X402PaymentRequirement` interface to include `scheme`, `rawAmount` (original string like "10000"), `maxTimeoutSeconds`, and `extra`
- Update `buildX402PaymentHeader` to match the exact structure from your working app:
  - Add `mimeType: "application/json"` to `resource`
  - Use raw amount (not human-readable) in `accepted`
  - Include `maxTimeoutSeconds` and `extra` in `accepted`
  - Include `scheme` from the original response

**2. Update `src/components/MoveMint.tsx`**

- Fix `[object Object]` bug in retry verification status (line 215) -- stringify error properly
- Add a collapsible **Payment Header Debug Panel** below the status area that shows:
  - Decoded PAYMENT-SIGNATURE payload (pretty-printed JSON)
  - The raw 402 response accepts data
  - Only visible when `signedTxBase64Ref` has data (after a payment attempt)

### Technical Details

Updated interface:
```text
interface X402PaymentRequirement {
  to: string;
  amount: string;        // human-readable (e.g. "0.01")
  rawAmount: string;     // original (e.g. "10000")
  token: string;
  tokenSymbol: string;
  network: string;
  description: string;
  scheme: string;        // "exact"
  maxTimeoutSeconds: number;
  extra: Record<string, unknown>;
}
```

Updated header payload:
```text
{
  x402Version: 2,
  resource: { url, description, mimeType: "application/json" },
  accepted: { scheme, network, amount: rawAmount, asset, payTo, maxTimeoutSeconds, extra },
  payload: { transaction: signedTxBase64 }
}
```

Debug panel: a toggleable `<details>` element showing the decoded header JSON, styled to match the existing dark UI.


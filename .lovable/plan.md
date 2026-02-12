

## Fix: Parse x402 v2 Response Format

### Problem
The x402 endpoint returns a v2 response where `accepts` is at the root level, not nested under `x402`. Field names also differ (e.g., `payTo` instead of `to`, `asset` instead of `token`). The current code looks for `data.x402.accepts` which is undefined, causing "No payment options returned."

### Change

**Update `src/lib/x402.ts`** -- `fetchX402Requirements` function only:

1. Look for `accepts` at both `data.x402.accepts` (v1) and `data.accepts` (v2)
2. Map v2 field names to our internal format:
   - `payTo` -> `to` (fallback from `to`)
   - `asset` -> `token` (fallback from `token`)
   - `extra.description` -> `description`
3. Convert raw amount strings (e.g., `"10000"` for 6-decimal USDC = 0.01) to human-readable decimal for display
4. No changes to `MoveMint.tsx` or `verifyX402Payment`

### Technical Details

The v2 response looks like:

```text
{
  "x402Version": 2,
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      "amount": "10000",
      "payTo": "H32Ynb...",
      "asset": "4zMMC9...",
      "extra": { "description": "Access to protected content..." }
    }
  ]
}
```

The parsing logic will be updated to:

```text
const accepts = data?.x402?.accepts || data?.accepts;
// Then for each option, normalize field names:
// to = option.payTo || option.to
// token = option.asset || option.token
// description = option.extra?.description || option.description
// amount: if raw integer string, divide by 1e6 for USDC display
```


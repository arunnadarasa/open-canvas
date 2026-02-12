

## Fix: "Failed to fetch" CORS Error with x402 Endpoint

### Problem
The browser blocks the `fetch()` call to `https://x402.payai.network/api/solana-devnet/paid-content` because the server doesn't return the correct CORS headers for the Lovable preview origin. This results in a `TypeError: Failed to fetch`.

### Solution
Use a lightweight CORS proxy approach. Since we can't control the x402 server's CORS policy, we'll create a Supabase Edge Function that proxies requests to the x402 endpoint server-side, bypassing the browser's CORS restriction.

### Changes

**1. New: `supabase/functions/x402-proxy/index.ts`**
- A Supabase Edge Function that:
  - Accepts GET requests with an optional `payment-signature` query param or header
  - Forwards the request to `https://x402.payai.network/api/solana-devnet/paid-content`
  - Passes through the `Payment-Signature` header if present
  - Returns the response with proper CORS headers
  - Handles both the initial 402 requirement fetch and the payment verification step

**2. Update: `src/lib/x402.ts`**
- Change the default endpoint URL to use the Supabase Edge Function proxy instead of calling the x402 endpoint directly
- The proxy URL will be constructed from the Supabase project URL (e.g., `https://<project>.supabase.co/functions/v1/x402-proxy`)
- Keep the same interface -- no changes needed in MoveMint.tsx

### How It Works

```text
Browser (MoveMint)
  -> GET /functions/v1/x402-proxy  (same-origin, no CORS issue)
  -> Edge Function forwards to x402.payai.network
  -> Returns 402 response with payment details

Browser (after payment)
  -> GET /functions/v1/x402-proxy + Payment-Signature header
  -> Edge Function forwards with header
  -> Returns 200 verified response
```

### Why This Approach
- No changes needed to the x402 server
- Edge Functions run server-side so CORS doesn't apply
- The proxy is simple and stateless
- MoveMint.tsx doesn't need any changes

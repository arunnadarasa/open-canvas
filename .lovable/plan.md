

## Fix: Add CorsProxy API Key

### Problem
CorsProxy requires an API key for requests. Without it, requests may be blocked or limited.

### Change

**Update `src/lib/x402.ts`**
- Change the CORS proxy URL from `https://corsproxy.io/?url=` to `https://corsproxy.io/?key=83d86fb9&url=`
- This is a one-line change in the `CORS_PROXY` constant


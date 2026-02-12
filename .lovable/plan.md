

# Helius API Key Integration

## What We'll Do

Use your Helius API key to **automatically register a webhook** that watches your MoveRegistry program for on-chain events. This removes any manual webhook setup -- one edge function call and it's done.

## Steps

### 1. Store the Helius API Key
Securely store your Helius API key ("Toucancopper") as a backend secret so it's available to edge functions.

### 2. Create a `helius-setup` Edge Function
A new edge function (`supabase/functions/helius-setup/index.ts`) that:
- Calls the Helius REST API (`POST https://api.helius.xyz/v0/webhooks?api-key=...`)
- Registers a webhook watching your program ID (`Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ`)
- Sets the webhook URL to your existing `helius-webhook` edge function endpoint
- Uses `webhookType: "enhanced"` for parsed transaction data
- Returns the created webhook ID for reference

### 3. Update the Existing `helius-webhook` Edge Function
Add an optional `Authorization` header check using the Helius API key as a shared secret, so only Helius can POST to it (optional security hardening).

### 4. Add a "Setup Webhook" Button or Auto-Setup
Add a simple way to trigger the setup function (either a button in the UI or call it once on deploy).

## Technical Details

### Helius Webhook Registration API Call
```text
POST https://api.helius.xyz/v0/webhooks?api-key=HELIUS_API_KEY

Body:
{
  "webhookURL": "https://rgfmvklcjnljsfsxztyi.supabase.co/functions/v1/helius-webhook",
  "transactionTypes": ["ANY"],
  "accountAddresses": ["Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ"],
  "webhookType": "enhanced"
}
```

### Files Changed
- **New**: `supabase/functions/helius-setup/index.ts`
- **Modified**: `supabase/functions/helius-webhook/index.ts` (minor auth hardening)
- **Secret**: `HELIUS_API_KEY` added to backend secrets

### Also Fix: The Runtime Error
The `BorshCoder` error from the IDL should already be resolved by the previous `types` addition. If it persists, we'll verify the IDL types array is complete and matches the on-chain program.


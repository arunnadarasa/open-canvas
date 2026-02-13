

# ClawKey Integration -- Optional Agent Registration

Add an optional "Register Your Claw Agent" flow so users can prove human ownership of their AI agent via ClawKey's VeryAI palm verification. This appears as an opt-in card in the Mint section -- users can mint without it, but verified users get a trust badge.

---

## What You'll See

- A new card below the mint form titled "Register Your Claw Agent" with a brief explanation
- Clicking "Register Agent" triggers the flow: generates a challenge, calls ClawKey API, and shows a registration link
- User clicks the link to complete palm verification (link is never auto-opened per ClawKey rules)
- Once verified, a "ClawKey Verified" badge appears (styled like the existing "Human Verified" badge)
- ClawKey added to the "Built With" tech stack grid

---

## Technical Details

### 1. Database: New `clawkey_agents` table

| Column | Type | Default |
|--------|------|---------|
| id | uuid (PK) | gen_random_uuid() |
| wallet_address | text (not null) | -- |
| device_id | text | -- |
| public_key | text | -- |
| session_id | text | -- |
| verified | boolean | false |
| registered_at | timestamptz | -- |
| created_at | timestamptz | now() |

RLS: Public read (anyone can check verification status), insert/update restricted to service role (edge functions only).

### 2. Edge Function: `supabase/functions/clawkey-register/index.ts`

- Receives `wallet_address` from client
- Generates Ed25519 key pair using Deno's `crypto.subtle`
- Builds AgentChallenge: `deviceId` = wallet address, `publicKey` (base64 DER SPKI), signed message, timestamp
- POSTs to `https://api.clawkey.ai/v1/agent/register/init`
- Stores key info in `clawkey_agents` table via service role
- Returns `sessionId` and `registrationUrl` to client

### 3. Edge Function: `supabase/functions/clawkey-status/index.ts`

- Accepts `sessionId`, calls `GET https://api.clawkey.ai/v1/agent/register/{sessionId}/status`
- On `completed`, updates `clawkey_agents` row with `verified = true` and `registered_at`
- Returns status to client

### 4. Config: `supabase/config.toml`

Add entries for both new functions with `verify_jwt = false`.

### 5. New Component: `src/components/ClawKeyRegister.tsx`

- Props: `walletAddress: string | null`
- Checks `clawkey_agents` table for existing verification
- If verified: shows "ClawKey Verified" badge (emerald style matching World ID badge)
- If not: shows a card with "Register Agent with ClawKey" button
  - On click: calls `clawkey-register` edge function
  - Shows the `registrationUrl` as a clickable link (user must click it manually)
  - Polls `clawkey-status` every 3 seconds until completed/failed/expired
  - On success: updates UI to show badge

### 6. Modified: `src/pages/Index.tsx`

- Import and render `ClawKeyRegister` after `MoveMint` component (around line 126), passing the connected wallet address
- Add ClawKey to the tech stack grid array:
  - `{ icon: Fingerprint, name: 'ClawKey', desc: 'Verifiable human ownership for AI agents', url: 'https://clawkey.ai' }`
- Import `Fingerprint` from lucide-react

### File Summary

| File | Action |
|------|--------|
| Database migration | Create `clawkey_agents` table with RLS |
| `supabase/functions/clawkey-register/index.ts` | Create |
| `supabase/functions/clawkey-status/index.ts` | Create |
| `src/components/ClawKeyRegister.tsx` | Create |
| `src/pages/Index.tsx` | Modify (add component + tech stack entry) |

No new npm dependencies needed.


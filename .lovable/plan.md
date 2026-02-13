
# Fix Greyed-Out ClawKey Button

## Problem

Same deadlock as the Moltbook fix: the "Register Agent with ClawKey" button has `disabled={loading || !walletAddress}`, but ClawKey is a gate **before** wallet connection. The message "Connect your wallet first to register." also shows, confirming the issue.

## Changes

### `src/components/ClawKeyRegister.tsx`

1. Remove `!walletAddress` from the button's `disabled` condition (keep only `disabled={loading}`)
2. Remove the conditional message "Connect your wallet first to register."
3. In `handleRegister`, remove the early `if (!walletAddress) return;` guard -- allow registration without a wallet
4. When calling the edge function, send `wallet_address` only if available (same pattern as the Moltbook fix)

### `supabase/functions/clawkey-register/index.ts`

1. Make `wallet_address` optional -- use a fallback identifier (e.g. a generated UUID) as `deviceId` if no wallet is provided
2. Still store the record, with `wallet_address` as null when not provided

### Database migration

1. `ALTER TABLE public.clawkey_agents ALTER COLUMN wallet_address DROP NOT NULL;` (if it has a NOT NULL constraint, same as the Moltbook fix)

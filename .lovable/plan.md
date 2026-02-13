

# Fix Greyed-Out Moltbook Button

## Problem

The "Join Moltbook" button is disabled because it checks `disabled={!walletAddress}`, but the wallet isn't connected yet -- Moltbook is now a gate **before** the wallet connect step. This creates a deadlock: can't register without a wallet, can't connect a wallet without registering.

## Solution

Remove the wallet address requirement from Moltbook registration at this stage. The registration will work with just the agent name and bio. The wallet address will be associated later (after the user connects their wallet and mints).

### Changes

**`src/components/MoltbookConnect.tsx`**
- Remove `disabled={!walletAddress}` from the "Join Moltbook" button so it's always clickable
- Update `handleRegister` to not require `walletAddress` -- send it if available, skip if not
- Remove the early return `if (!walletAddress) return;` from `handleRegister`

**`supabase/functions/moltbook-register/index.ts`**
- Make `wallet_address` optional in the request body (it was required before)
- If no wallet address is provided, generate a temporary placeholder or skip the DB wallet association
- Still register the agent on Moltbook API (which only needs name + description)
- Store the record with a null/empty wallet address, to be updated later

### Flow After Fix

1. User completes WorldID and ClawKey gates
2. Moltbook card appears with an active "Join Moltbook" button
3. User clicks it, enters name + bio, registers (no wallet needed)
4. Gate passes, wallet connect + minting form appears
5. "Skip for demo" button also remains available as before


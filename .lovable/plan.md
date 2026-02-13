

# Fix ClawKey Verification Flow -- UI Not Updating After Verification

The ClawKey verification actually completed successfully (the API confirms "session already completed"), but the app doesn't reflect this because of two bugs.

---

## What's Wrong

1. **Database upsert silently fails**: The `clawkey-register` edge function uses `upsert({ onConflict: 'wallet_address' })` but `wallet_address` has no unique constraint, so Supabase can't match on it. Result: no rows are ever saved to the database.
2. **"Already registered" not handled**: When a user tries to register again after completing verification, ClawKey returns an error. The code shows this as a red error message instead of recognizing the agent is verified.
3. **Status polling has no row to update**: The `clawkey-status` function tries to `UPDATE ... WHERE session_id = X`, but since no row was created (bug 1), it updates nothing.

---

## The Fix

### 1. Database Migration -- Add unique constraint on `wallet_address`

Add a `UNIQUE` constraint so that `upsert` with `onConflict: 'wallet_address'` works correctly.

```sql
ALTER TABLE public.clawkey_agents ADD CONSTRAINT clawkey_agents_wallet_address_unique UNIQUE (wallet_address);
```

### 2. Edge Function: `supabase/functions/clawkey-register/index.ts`

When ClawKey returns an error indicating the agent is already registered (HTTP 400/409 with message containing "already registered" or "already completed"):
- Instead of returning an error to the client, update the database row to `verified = true`
- Return `{ alreadyVerified: true }` so the client can show the badge immediately

### 3. Component: `src/components/ClawKeyRegister.tsx`

- Handle the `alreadyVerified: true` response from the edge function by setting `verified = true` immediately
- This way, even if the user completed verification but the polling missed it, clicking "Register" again will recover gracefully

---

## Files to Change

| File | Action |
|------|--------|
| Database migration | Add unique constraint on `wallet_address` |
| `supabase/functions/clawkey-register/index.ts` | Handle "already registered" as success |
| `src/components/ClawKeyRegister.tsx` | Handle `alreadyVerified` response |




## World ID Verification Gate

Add World ID proof-of-personhood verification as a required step before users can connect their wallet and mint. The app ID is `app_0abc6adff26c25102bd04dc58f5a66a8` with action `moveregistry`.

### Flow

```text
User lands on page
  -> Sees "Verify with World ID" button (wallet connect is hidden)
  -> Completes World ID verification in IDKit widget
  -> Proof is sent to backend edge function for cloud verification
  -> On success, verification state is stored in localStorage
  -> Wallet connect button becomes available
  -> User can now mint
```

### Files to Create

**1. `src/components/WorldIDVerify.tsx`**
- Uses `IDKitWidget` from `@worldcoin/idkit`
- App ID: `app_0abc6adff26c25102bd04dc58f5a66a8`, action: `moveregistry`
- `handleVerify` callback sends proof to the edge function
- On success, calls a callback to unlock wallet connection
- Shows verification badge (green shield) when verified
- Glassmorphism styling consistent with existing design

**2. `supabase/functions/verify-worldid/index.ts`**
- Receives proof payload (merkle_root, nullifier_hash, proof, verification_level)
- Calls `https://developer.worldcoin.org/api/v2/verify/app_0abc6adff26c25102bd04dc58f5a66a8`
- Returns success/failure to frontend
- No database table needed -- verification state lives in localStorage (no auth system in this app)
- CORS headers included

### Files to Modify

**3. `src/components/MoveMint.tsx`**
- Add `isWorldIDVerified` prop
- When not verified, show the WorldIDVerify component instead of the wallet connect button
- When verified, show a small "Human Verified" badge next to the wallet section
- Gate the entire wallet connect flow behind verification

**4. `src/pages/Index.tsx`**
- Add `worldIdVerified` state (persisted in localStorage)
- Pass it down to MoveMint

**5. `supabase/config.toml`**
- Add `[functions.verify-worldid]` with `verify_jwt = false` (public endpoint, no auth)

**6. `package.json`**
- Add `@worldcoin/idkit` dependency

### Edge Function Details

The verify-worldid function will:
- Accept POST with `{ merkle_root, nullifier_hash, proof, verification_level }`
- Forward to World ID cloud verification API
- Return `{ success: true }` or `{ success: false, error: "..." }`
- No secrets needed -- the app ID is public and hardcoded in the verification URL

### UI Design

- Before verification: Large "Verify You're Human" card with World ID button, replaces the wallet connect area
- After verification: Small green "Verified Human" badge, wallet connect becomes available
- The verification persists in localStorage so users don't re-verify on page refresh




# Fix Moltbook Claim Link Not Showing

## Root Cause

Two bugs in `MoltbookConnect.tsx`:

1. **Race condition**: `fetchingStatus` initializes to `false`, so the badge-mode check (`isVerified && !claimUrl && !fetchingStatus`) immediately returns the pill badge on first render -- before the `useEffect` has a chance to fire and fetch data.

2. **Missing wallet address**: The user's screenshot shows "Connect Wallet" is still visible, meaning `walletAddress` from Privy may be `null`. The `useEffect` has an early return when `walletAddress` is null, so it never fetches claim status.

## Fix

### `src/components/MoltbookConnect.tsx`

1. Initialize `fetchingStatus` to `true` when `isVerified` is passed -- this prevents the pill badge from flashing before the fetch completes.

2. Handle the case where `walletAddress` is null but `isVerified` is true: show a "Connect wallet to see your claim link" message instead of the pill badge. Or better yet, try to look up by localStorage-stored wallet address.

3. Reorder the rendering logic so the component only shows the pill badge when we have **confirmed** the agent is claimed (not as a default fallback).

### Specific code changes

**Line 17** -- Change initialization:
```typescript
const [fetchingStatus, setFetchingStatus] = useState(!!isVerified);
```

**useEffect** -- When walletAddress is null, set fetchingStatus to false so we don't show loading forever. The pill badge will render, which is correct when we genuinely can't look up status.

**Badge-mode condition** -- Change from showing pill when "no claimUrl and not fetching" to showing pill only when "confirmed claimed":
```typescript
// Show pill badge only if confirmed claimed
if (isVerified && claimed && !fetchingStatus) {
  return <pill badge />;
}

// Show claim card if registered but unclaimed  
if (isVerified && claimUrl && !claimed && !fetchingStatus) {
  return <claim card with link />;
}
```

This ensures:
- While fetching: shows loading spinner
- After fetch, unclaimed: shows the full claim card with link
- After fetch, claimed: shows the small pill badge
- No wallet address: falls through to "connect wallet" or registration UI

### Files to change

| File | Change |
|------|--------|
| `src/components/MoltbookConnect.tsx` | Fix fetchingStatus initialization and badge-mode logic |


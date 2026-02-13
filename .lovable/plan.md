

# Auto-Detect Existing Moltbook Registration

## Problem

You already joined Moltbook, but the "Join Moltbook" card still appears because the localStorage flag (`moltbook_registered`) was added after your original registration. The flag was never set for your wallet.

## Fix

### `src/pages/Index.tsx`

Add a useEffect that checks the database for an existing Moltbook registration when the wallet is connected. If a record is found, set `moltbook_registered` in localStorage and update the state so the card hides automatically.

This mirrors the pattern already used in `MoltbookConnect` for badge mode, but at the page level to control whether the registration card shows at all.

### Technical Detail

```text
On mount (when walletAddress is available):
  1. Check localStorage for 'moltbook_registered' -- if already set, skip
  2. Query moltbook_agents_public view for the wallet
  3. If record exists, set localStorage('moltbook_registered', 'true') and setMoltbookRegistered(true)
```

This is a single useEffect addition -- no other files need changes.

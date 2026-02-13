

# Fix Moltbook Card Flash on First Load

## Problem

The "Join Moltbook" card still shows briefly because:
1. The latest code with auto-detect may not be published yet
2. Even with the fix, the card flashes while the async DB query runs -- it defaults to showing the card, then hides it after the query completes

## Fix

### `src/pages/Index.tsx`

Change the auto-detect logic so that when a wallet is connected and localStorage doesn't have the flag, the Moltbook card is **hidden** (not shown) while the database check is in progress.

Specifically:
- Add a `moltbookChecking` state initialized to `true` when the wallet is connected and localStorage doesn't have the flag
- The useEffect sets `moltbookChecking = false` after the DB query finishes
- The conditional rendering of `MoltbookConnect` checks: if `moltbookChecking` is true, don't render the card at all (or show a subtle loading state)
- If DB returns a record, set localStorage and state as before
- If no record, set `moltbookChecking = false` and show the registration card

### Technical Detail

```text
State changes:
  - Add: moltbookChecking (boolean, default: !localStorage.has('moltbook_registered') && walletAddress exists)
  
  useEffect (walletAddress changes):
    if localStorage already set -> skip, moltbookChecking = false
    else -> query DB
      found -> set localStorage, setMoltbookRegistered(true), moltbookChecking = false
      not found -> moltbookChecking = false (show registration card)

  Render condition:
    if moltbookChecking -> hide MoltbookConnect card entirely
    if moltbookRegistered -> hide card (badge shows via MoltbookConnect badge mode)
    else -> show registration card
```

This is a small change to the existing useEffect and render logic in Index.tsx only. No other files need changes.

After implementing, you should **publish** the app so the fix is live.

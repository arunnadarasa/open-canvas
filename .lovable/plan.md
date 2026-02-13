

# Fix Moltbook Badge Not Showing After Registration

## Problem

Two early-return guards prevent the localStorage fallback from ever running when there is no wallet connected:

1. In `MoltbookConnect.tsx` (line 42-44): the badge-mode useEffect returns early when `walletAddress` is null, so the localStorage fallback (line 58-63) is never reached.
2. In `Index.tsx` (line 58-62): the auto-detect useEffect also exits early when no wallet, so `moltbookRegistered` stays false and the full "Join Moltbook" card keeps showing.

## Changes

### 1. `src/components/MoltbookConnect.tsx` -- Fix the badge-mode useEffect

When `walletAddress` is null, instead of returning early, check localStorage for the cached agent name and show the badge if found:

```
if (!walletAddress) {
  const cachedName = localStorage.getItem('moltbook_agent_name');
  if (cachedName) {
    setAgentName(cachedName);
    setRegistered(true);
  }
  setFetchingStatus(false);
  return;
}
```

### 2. `src/pages/Index.tsx` -- Fix the auto-detect useEffect

When `walletAddress` is null, also check localStorage for `moltbook_agent_name` before returning:

```
if (!walletAddress) {
  const cachedName = localStorage.getItem('moltbook_agent_name');
  if (cachedName) {
    localStorage.setItem('moltbook_registered', 'true');
    setMoltbookRegistered(true);
  }
  setMoltbookChecking(false);
  return;
}
```

## Result

After registration, the badge will display correctly even before a wallet is connected, because both components will find the agent name in localStorage as a fallback.

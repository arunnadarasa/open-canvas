

# Persist "I've Claimed It" State via localStorage

## What This Does

When the user clicks "I've Claimed It", save the wallet address to localStorage so the claim card never shows again on future page loads. Currently the button only updates in-memory state, so if the user registered in a previous session, the useEffect fetches the record and shows the badge -- but during the same session after registering, clicking the button is ephemeral.

This fix ensures that even in the registration session, once they click "I've Claimed It", that preference is remembered.

## Changes

### `src/components/MoltbookConnect.tsx`

1. On component mount, check `localStorage` for a key like `moltbook_claimed_{walletAddress}`. If found, set `justRegistered` to `false` (ensuring the badge shows, not the claim card).

2. Update the "I've Claimed It" button handler to:
   - Save `moltbook_claimed_{walletAddress}` to localStorage
   - Then set `justRegistered(false)` as before

3. This way:
   - First-time registration: claim card shows with the button
   - User clicks "I've Claimed It": localStorage flag saved, badge shown
   - Future page loads: useEffect finds the DB record and shows badge directly (localStorage is a fallback safety net)

### Technical Detail

```text
Button click:
  localStorage.setItem(`moltbook_claimed_${walletAddress}`, 'true')
  setJustRegistered(false)

On registration success:
  Check localStorage -- if already claimed, skip showing claim card
```

No database changes needed. This is a client-side preference stored in the browser.

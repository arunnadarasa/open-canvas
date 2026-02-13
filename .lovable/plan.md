

# Add "I've Claimed It" Button to Moltbook Card

## What This Does

Adds a button to the "just registered" claim card that lets you confirm you've already claimed your agent on Moltbook. Clicking it dismisses the card and transitions to the small "Moltbook Agent" badge.

## Changes

### `src/components/MoltbookConnect.tsx`

1. Add a "I've Claimed It" button next to the existing "Claim on Moltbook" and "View dancetech" buttons in the just-registered card (lines 93-111)
2. Clicking it sets `justRegistered` to `false`, which causes the component to fall through to the badge view (line 54 condition becomes true since `registered` is already true)
3. No database changes needed -- this is purely a UI dismissal

### Technical Detail

The button simply calls `setJustRegistered(false)`. Since `registered` is already `true` and `isVerified` is `true`, the component re-renders into the badge at line 54. On next page load, the `useEffect` fetches the record and shows the badge directly (no `justRegistered` state persisted).


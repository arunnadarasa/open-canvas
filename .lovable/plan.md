

# Simplify Moltbook Flow: Skip Claim Tracking

## Problem

The Moltbook API has no webhook to notify us when a user claims their agent. So the `claimed` flag in our database stays `false` forever unless manually updated. This creates a broken UX where the "Claim on Moltbook" card keeps showing even after the user has already claimed.

## Simpler Approach

Stop tracking `claimed` status entirely. Once an agent is **registered**, that's sufficient -- show the "Moltbook Agent" badge immediately, with a link to the user's Moltbook profile page for managing their agent/API key.

## Changes

### `src/components/MoltbookConnect.tsx`

1. Remove the `claimed` state and all logic that depends on it
2. When `isVerified` is true and a record exists in `moltbook_agents_public`, show the badge immediately
3. Add a small "Manage" link on the badge that opens the user's Moltbook agent profile (e.g., `https://moltbook.com/u/{agent_name}`)
4. When `isVerified` is true but no record exists, fall through to the "Join Moltbook" registration card as before
5. After successful registration, show a one-time confirmation with the claim URL (for first-time setup), then badge on subsequent visits

### Rendering Logic (simplified)

```text
isVerified + record found --> Badge with "Manage" link
isVerified + no record    --> "Join Moltbook" registration card
!isVerified               --> "Join Moltbook" registration card
```

### No Database Changes Needed

The existing `moltbook_agents_public` view already exposes `agent_name` and `wallet_address`, which is all we need. The `claimed` column becomes unused but harmless.


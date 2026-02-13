

# Show Moltbook Claim Link After Registration

## Problem

The `MoltbookConnect` component has two modes:
1. **Badge mode** -- when `isVerified={true}` is passed, it shows only a small "Moltbook Agent" pill badge with no claim link
2. **Registration mode** -- after clicking "Join Moltbook", it shows the claim URL

When the page reloads after registration, `isVerified={true}` is set from localStorage, so badge mode activates and the claim link disappears. The user never gets to see their claim URL.

## Solution

Modify `MoltbookConnect` so that when rendered as a badge (`isVerified={true}`), it fetches the user's registration data from the `moltbook_agents` table and shows the claim link if the agent hasn't been claimed yet.

## Changes

### `src/components/MoltbookConnect.tsx`

1. When `isVerified` is true, fetch the user's record from `moltbook_agents` using their wallet address
2. If `claimed === false`, show an expanded badge with the claim link (instead of just the pill)
3. If `claimed === true`, show the simple pill badge as it currently does
4. This way, returning users who haven't claimed yet will always see their claim URL

### Technical Details

- Add a `useEffect` that runs when `isVerified && walletAddress` to query the `moltbook_agents` table for `claim_url` and `claimed` status
- Note: The `moltbook_agents` table currently has **no RLS policies**, so client-side reads will work. We should add a SELECT policy that only exposes `agent_name`, `claim_url`, and `claimed` (never `api_key`) -- or use a database view that excludes `api_key`.
- If `claimed` is false and `claim_url` exists, render the card with the claim link and "View dancetech" button
- If `claimed` is true (or no record found), render the existing small badge

### Database: Add RLS policy for safe client reads

Create a SELECT policy on `moltbook_agents` that allows anyone to read only non-sensitive columns. Since RLS policies control row access (not column access), we will create a **database view** called `moltbook_agents_public` that exposes only `wallet_address`, `agent_name`, `claim_url`, and `claimed` -- excluding `api_key`.

Alternatively, since the table currently has RLS disabled, we can enable RLS with a SELECT policy and have the client query only the columns it needs. The `api_key` column would still be readable technically, but the client code would never request it. For stronger protection, a view is preferred.

### Files to change

| File | Action |
|------|--------|
| `src/components/MoltbookConnect.tsx` | Fetch claim status on load when in badge mode; show claim link if unclaimed |
| DB migration | Create a `moltbook_agents_public` view or add a SELECT RLS policy |


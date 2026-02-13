

# Add "Claim on Moltbook" Button to Badge

## What's Missing

The Moltbook badge (visible in the screenshot as "Moltbook Agent" with the external link icon) only links to the agent's profile page. There's no clear "Claim" action for newly registered agents who haven't yet claimed their account on Moltbook.

## Change

### `src/components/MoltbookConnect.tsx`

Update the badge-mode rendering (lines 84-101) to include a "Claim" link next to the badge when a `claimUrl` is available (either from the DB or from localStorage):

- Store `claimUrl` in localStorage during registration (alongside `agent_name`)
- In the badge-mode useEffect, also read `moltbook_claim_url` from localStorage as fallback
- In the badge UI, if `claimUrl` exists, render a small "Claim" button/link pointing to it instead of just the generic profile link

The badge will look like: `[Users icon] Moltbook Agent [Claim button]`

Once the user has claimed, the external link falls back to the profile URL as it does now.


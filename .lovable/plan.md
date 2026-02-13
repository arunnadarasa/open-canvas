

# Fix Moltbook Posting: Subscribe to Submolt + Accurate UI Status

## Root Cause

Two issues are causing the "Posted to Moltbook" message to appear when nothing was actually posted:

1. **The agent isn't subscribed to the dancetech submolt.** Moltbook requires agents to join a submolt before posting. The registration flow creates the agent but never subscribes it to `m/dancetech`.

2. **The UI always shows "Posted to Moltbook"** when the on-chain verification succeeds, regardless of whether the Moltbook comment actually went through. The `moltbookPost` response from the backend (which includes `skipped: true` or error info) is ignored by the frontend.

Additionally, the logs show the agent was **rate limited** because it's less than 24 hours old (can only post once every 2 hours).

## Changes

### 1. `supabase/functions/moltbook-register/index.ts`

After successfully registering the agent, add a call to subscribe the agent to the dancetech submolt:

```
POST https://www.moltbook.com/api/v1/submolts/dancetech/subscribe
Authorization: Bearer {api_key}
```

This ensures the agent can post to dancetech immediately after registration. If the subscribe call fails, log a warning but don't block registration.

### 2. `supabase/functions/moltbook-comment/index.ts`

Add a safety check: before posting, try to subscribe the agent to dancetech (idempotent -- if already subscribed, it's a no-op or returns success). This handles agents that were registered before this fix.

### 3. `src/components/MoveMint.tsx`

Update the UI to check the actual `moltbookPost` response from the nft-metadata function:

- If `moltbookPost.success` is true: show "Posted to Moltbook" with the link
- If `moltbookPost.skipped` is true: show "Moltbook: skipped" with a subtle note (e.g., rate limited or no agent)
- If `moltbookPost` is null or has an error: don't show the Moltbook line at all

This requires passing the `moltbookPost` data from the mint response into the component's state.

### Technical Summary

```text
Registration flow:
  1. Register agent (existing)
  2. NEW: Subscribe agent to dancetech submolt
  3. Store credentials (existing)

Comment flow:
  1. NEW: Ensure subscribed to dancetech (safety net)
  2. Post comment (existing)

UI:
  - Check moltbookPost response before showing "Posted to Moltbook"
```

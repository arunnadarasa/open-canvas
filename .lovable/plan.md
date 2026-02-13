

# Moltbook Integration with Move Registry

## What is Moltbook?

Moltbook is a social network for AI agents. Agents can post, comment, upvote, and participate in communities ("submolts"). It has a REST API at `https://www.moltbook.com/api/v1`.

---

## Integration Vision

When a creator mints a dance move NFT, the app auto-posts it to Moltbook, giving the move social visibility across the agent ecosystem. The Move Registry itself becomes a "molty" (an agent on Moltbook).

```text
User mints move
      |
      v
NFT created on Solana
      |
      v
Edge function posts to Moltbook
      |
      v
Other agents discover the move
via Moltbook feed
```

---

## Implementation Steps

### 1. Register the Move Registry as a Moltbook Agent

Create an edge function `moltbook-register` that calls:

```
POST https://www.moltbook.com/api/v1/agents/register
{ "name": "MoveRegistry", "description": "Decentralized choreography skill registry on Solana" }
```

This returns an `api_key` and a `claim_url`. The API key gets stored as a secret (`MOLTBOOK_API_KEY`). You (the human) visit the `claim_url` to claim the agent.

### 2. Create a Submolt for Dance Moves

Create a crypto-friendly community for choreography skills:

```
POST https://www.moltbook.com/api/v1/submolts
{ "name": "moveclaw", "display_name": "MoveClaw Registry", "description": "Dance moves minted as NFTs on Solana", "allow_crypto": true }
```

### 3. Auto-Post on Mint

Create an edge function `moltbook-post` that gets called after a successful mint. It posts the move details to the `moveclaw` submolt:

```
POST https://www.moltbook.com/api/v1/posts
{
  "submolt": "moveclaw",
  "title": "New Move: [move_name]",
  "content": "Creator: [wallet]\nRoyalty: [percent]%\nMint: [pubkey]\n\n[choreography DSL or description]",
  "url": "https://moveregistry.lovable.app"
}
```

### 4. Show Moltbook Engagement in the UI (Optional)

Add a small Moltbook section to the Certificate Gallery showing upvote counts or comments fetched from the Moltbook API for each posted move.

---

## Files to Create / Change

| File | Action |
|------|--------|
| `supabase/functions/moltbook-register/index.ts` | New -- register agent, return claim URL |
| `supabase/functions/moltbook-post/index.ts` | New -- post a minted move to Moltbook |
| `supabase/functions/nft-metadata/index.ts` | Modify -- call `moltbook-post` after successful mint |
| `src/pages/Index.tsx` | Minor -- show Moltbook link/badge after posting |
| Secret: `MOLTBOOK_API_KEY` | Store after registration |

---

## Step-by-Step Rollout

1. **Register**: Deploy `moltbook-register`, call it once, save the API key as a secret, visit the claim URL to activate
2. **Create submolt**: Call the submolt creation endpoint via the edge function or curl
3. **Auto-post**: Wire `moltbook-post` into the mint flow so every new move gets posted
4. **UI polish**: Optionally display Moltbook engagement metrics on minted moves

---

## Notes

- Moltbook requires `allow_crypto: true` on any submolt where NFT/blockchain content is posted (default is false and crypto posts get auto-removed)
- The API key must only be sent to `https://www.moltbook.com` -- it lives server-side in the edge function, never exposed to the client
- Registration is a one-time step; after that, posting is automated per mint


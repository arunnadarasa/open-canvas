

# Per-User Moltbook Integration (Revised)

## Summary

Each verified user registers their own Moltbook agent identity when they connect their wallet. Their API key is stored server-side in the database. When they mint a move, a **comment** is posted under an anchor post on the `dancetech` submolt (`https://www.moltbook.com/m/dancetech`). Users manage their API key and profile on Moltbook's own dashboard at `moltbook.com` -- no custom dashboard needed in this app.

## Flow

```text
World ID verified + ClawKey verified + Wallet connected
                    |
                    v
        "Join Moltbook" button appears
                    |
                    v
    Edge function registers agent (name = MR-{wallet_prefix})
    Returns claim_url --> user visits moltbook.com to claim
    api_key stored in moltbook_agents table (server-side only)
                    |
                    v
            User mints a move
                    |
                    v
    nft-metadata edge function posts a COMMENT
    under the dancetech anchor post
    using the user's personal api_key
                    |
                    v
    "Posted to Moltbook" confirmation shown
    Link to moltbook.com/m/dancetech for audit trail
```

## Database

### New table: `moltbook_agents`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen\_random\_uuid() |
| wallet\_address | text | unique, not null |
| agent\_name | text | not null |
| api\_key | text | not null (server-side only, never sent to client) |
| claim\_url | text | returned to client for user to visit |
| claimed | boolean | default false |
| moltbook\_post\_id | text | nullable -- stores the anchor post ID if this user created one |
| created\_at | timestamptz | default now() |

RLS: Service-role-only access (edge functions). No client-side reads of api\_key.

## Edge Functions

### 1. `moltbook-register` (rewrite)

- Accepts `{ wallet_address }` from client
- Generates agent name: `MR-{first 8 chars of wallet}`
- Calls `POST /api/v1/agents/register` on Moltbook
- Stores `api_key` in `moltbook_agents` (never returned to client)
- Returns `{ claim_url, agent_name }` to client
- If wallet already registered, returns existing claim\_url

### 2. `moltbook-comment` (new, replaces `moltbook-post`)

- Called after successful mint (from `nft-metadata`)
- Looks up user's `api_key` from `moltbook_agents` by wallet
- If no Moltbook account, skips silently (not all users will register)
- Posts a **comment** on the dancetech anchor post containing: move name, creator wallet, mint pubkey, expression snippet
- Handles 20-second rate limit gracefully (logs warning, does not fail the mint)
- The anchor post ID for the `dancetech` submolt will be stored as a constant or looked up from the database

### 3. `moltbook-post` (simplify)

- One-time use: creates the initial "hello world" anchor post on `/m/dancetech`
- Content: introduction of MoveRegistry with wallet/human-verified/clawkey-verified context
- Stores the resulting `post_id` for use by `moltbook-comment`

### 4. `nft-metadata` (modify)

- Remove existing inline Moltbook post logic
- After successful metadata upload, call `moltbook-comment` with wallet address and move details
- Fire-and-forget: Moltbook comment failure does not block the mint response

## UI Changes

### New component: `MoltbookConnect.tsx`

- Appears after both verification gates pass and wallet is connected
- "Join Moltbook" button that calls `moltbook-register` with the wallet address
- On success, shows the `claim_url` as a link to visit moltbook.com and claim the agent
- Polls `moltbook_agents` table for `claimed` status (or just shows "Visit Moltbook to manage your agent")
- Once registered, shows a "Moltbook Agent" badge with link to moltbook.com dashboard
- Follows the same card style as WorldIDVerify and ClawKeyRegister

### `Index.tsx`

- Add `MoltbookConnect` as a third gate/badge after ClawKey, but **not blocking** -- it is optional
- Show the badge inline with World ID and ClawKey badges when registered

### `MoveMint.tsx` (minor)

- After successful mint, if Moltbook comment was posted, show a small "Posted to Moltbook" link pointing to `moltbook.com/m/dancetech`

## Config

### `supabase/config.toml`

- Add `moltbook-comment` function with `verify_jwt = false`

## Rate Limit Handling

- Comments: 1 per 20 seconds -- since comments only happen on mint, this is unlikely to be hit. If rate-limited, log and continue.
- Posts: 1 per 30 minutes -- the anchor post is created once, so not a concern.

## Files to Create / Change

| File | Action |
|------|--------|
| DB migration | Create `moltbook_agents` table |
| `supabase/functions/moltbook-register/index.ts` | Rewrite for per-user registration |
| `supabase/functions/moltbook-comment/index.ts` | New -- post comments using user's API key |
| `supabase/functions/moltbook-post/index.ts` | Simplify to one-time anchor post creation |
| `supabase/functions/nft-metadata/index.ts` | Replace inline post with moltbook-comment call |
| `src/components/MoltbookConnect.tsx` | New -- join/claim UI (optional gate) |
| `src/pages/Index.tsx` | Add MoltbookConnect badge and component |
| `src/components/MoveMint.tsx` | Show "Posted to Moltbook" link after mint |
| `supabase/config.toml` | Add moltbook-comment config |

## Key Design Decisions

- **No custom dashboard** -- users manage their API key and agent profile on moltbook.com (as shown in the screenshots). The "Refresh API Key" and "Quick Info" sections are all on Moltbook's side.
- **API key never leaves the server** -- stored in DB, used only in edge functions, never sent to the client.
- **Moltbook registration is optional** -- users can mint without it. If they have a Moltbook agent, mints get posted as comments; if not, minting works the same as before.
- **Audit trail on dancetech** -- one anchor post introduces the registry, all mints appear as threaded comments under it, creating a chronological record.


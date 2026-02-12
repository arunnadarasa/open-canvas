

# Anchor Program Integration Plan

## Summary
Wire up the deployed Anchor program (`Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ`) to the frontend, persist minted moves in the database, and add a Helius webhook endpoint for indexing on-chain events.

---

## Phase 1: Database Tables

Create two tables to persist on-chain data:

**`minted_moves`** -- stores each minted skill NFT
- `id` (uuid, PK)
- `creator_wallet` (text) -- Solana pubkey
- `move_name` (text)
- `expression` (text) -- IPFS CID or description
- `royalty_percent` (smallint)
- `mint_pubkey` (text) -- the NFT mint address
- `skill_pda` (text) -- the SkillAccount PDA address
- `tx_signature` (text)
- `payment_method` (text) -- 'usdc' or 'sol'
- `verified` (boolean, default false)
- `created_at` (timestamptz)

**`royalty_events`** -- populated by Helius webhook when SkillLicensed events fire
- `id` (uuid, PK)
- `mint_pubkey` (text)
- `payer_wallet` (text)
- `amount` (bigint) -- raw token amount
- `royalty_amount` (bigint)
- `tx_signature` (text)
- `created_at` (timestamptz)

Both tables will have RLS disabled (public-facing data, no auth required for reads; webhook inserts via service role key).

---

## Phase 2: Anchor IDL + Client Helpers

Create `src/lib/anchor-idl.ts` containing:
- The full IDL JSON exported as a TypeScript constant (derived from your deployed program's IDL)
- Helper functions to derive PDAs:
  - `getTreasuryPDA()` -- seeds: `["treasury"]`
  - `getSkillDataPDA(mintPubkey)` -- seeds: `["skilldata", mintPubkey]`

Create `src/lib/anchor-client.ts` with:
- A function to build the `mint_skill` instruction using `@coral-xyz/anchor` (Program class + IDL)
- A function to build the `verify_skill` instruction
- Both return unsigned `Transaction` objects ready for Phantom signing

---

## Phase 3: Update Minting Flow (`MoveMint.tsx`)

The current flow does a simple token transfer. The new flow will:

1. **Generate a new Keypair** for the NFT mint account
2. **Derive the SkillAccount PDA** from the mint pubkey
3. **Derive the Treasury PDA**
4. **Build a transaction** with the `mint_skill` instruction (passing move name, expression, royalty percent)
5. **Sign with Phantom** (the creator signs; the mint keypair also partially signs)
6. **Broadcast on-chain**
7. **After success**: call `verify_skill` if x402 payment was completed, or mark as unverified
8. **Persist** the move to the `minted_moves` database table
9. Call `onMintSuccess` to update the UI

The x402 payment flow remains as-is but becomes the verification step (calling `verify_skill` on-chain after the facilitator confirms payment).

---

## Phase 4: Update Data Layer

Replace `useMintedMoves` hook:
- Fetch moves from the `minted_moves` database table instead of localStorage
- `addMove` inserts into the database
- Remove mock data and localStorage logic
- Keep the same `MintedMove` interface shape (map DB columns to it)

---

## Phase 5: Helius Webhook Edge Function

Create `supabase/functions/helius-webhook/index.ts`:
- Accepts POST requests from Helius
- Parses `SkillLicensed` events from the transaction logs
- Inserts rows into `royalty_events` table
- Returns 200 OK

You will need to configure the Helius webhook externally to point at this edge function URL.

---

## Phase 6: Real Royalty Tracker

Update `RoyaltyTracker.tsx`:
- Query `royalty_events` table for the connected wallet's moves
- Show real earnings instead of mock data
- Keep the animated counter and progress bar UI

---

## Technical Details

### PDA Derivation (TypeScript)
```text
Treasury PDA:
  seeds = [Buffer.from("treasury")]
  programId = Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ

SkillData PDA:
  seeds = [Buffer.from("skilldata"), mintPubkey.toBytes()]
  programId = Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ
```

### Mint Transaction Structure
The `mint_skill` instruction requires these accounts:
- `creator` (signer, mut) -- the user's wallet
- `skillMint` (mut) -- a fresh Keypair for the NFT mint
- `treasury` (PDA)
- `skillData` (PDA, init)
- `systemProgram`
- `tokenProgram`
- `usdcMint` (the devnet USDC mint address)

### Files Changed
- **New**: `src/lib/anchor-idl.ts`, `src/lib/anchor-client.ts`, `supabase/functions/helius-webhook/index.ts`
- **Modified**: `src/components/MoveMint.tsx`, `src/hooks/useMintedMoves.ts`, `src/components/RoyaltyTracker.tsx`
- **Database**: 2 new tables (`minted_moves`, `royalty_events`)


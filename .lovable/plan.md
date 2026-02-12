

# Integrate User Feedback: Memo Proofs, OpenClaw Skill Format, and Conditional DSL

Three enhancements based on community feedback, each building on the existing architecture.

---

## 1. x402 Memo Instruction -- Proof-of-Payment On-Chain

**What**: Add a Solana Memo Program instruction to the mint transaction that embeds a proof-of-payment reference (x402 payment hash or facilitator tx ID) directly in the NFT's on-chain history.

**Why**: Links royalty payments to on-chain proof, making verification trustless and auditable.

**Changes**:
- **`src/components/MoveMint.tsx`**: After x402 verification succeeds and returns `tx_hash`, build a follow-up transaction with a Memo instruction containing `x402:<tx_hash>` and have Phantom sign/send it. Alternatively, embed the memo in the `verify_skill` transaction that already runs post-payment.
- **`src/lib/anchor-client.ts`**: Add a helper `buildMemoInstruction(message: string)` using the Memo Program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`).

---

## 2. OpenClaw Skill Format -- SKILL.md + skill.json

**What**: Generate an OpenClaw-compatible skill package for each minted move, consisting of:
- `skill.json` (metadata: name, version, creator, royalty, mint address, conditions)
- `SKILL.md` (human/agent-readable description with API endpoints for licensing)

Both hosted alongside the NFT metadata in storage.

**Why**: AI agents using ClawHub or similar skill discovery endpoints can parse and install moves directly.

**Changes**:
- **`supabase/functions/nft-metadata/index.ts`**: Extend to also generate and upload `skill.json` and `SKILL.md` files to the `nft-metadata` storage bucket. Return their URLs alongside the existing metadata URI.
- **`src/hooks/useMintedMoves.ts`**: Add `skillJsonUri` and `skillMdUri` to the `MintedMove` type.
- **`src/components/MoveMint.tsx`**: Pass the new URIs through the mint flow.
- **New file: `public/skill.md`**: A root-level SKILL.md for the OpenClaw registry itself (like Moltbook's), describing the registry API and linking to individual skill files.

---

## 3. Conditional Choreography DSL -- Parameterized Skills

**What**: Extend the "expression" field into a lightweight DSL that supports conditional triggers. Example:

```text
dance:chest_pop if sentiment > 0.8
dance:wave if proximity < 2.0
dance:idle otherwise
```

**Why**: Downstream agents can compose movements into emergent behaviors based on environmental inputs (sentiment, proximity, audio, etc.).

**Changes**:
- **`src/lib/skill-dsl.ts`** (new file): A parser/validator for the conditional DSL format. Validates syntax before minting, converts to a structured JSON representation stored in skill.json.
- **`src/components/MoveMint.tsx`**: Replace the plain "Video Hash or Expression" input with a DSL-aware editor that shows syntax hints and validates conditions. Keep backward compatibility with plain text/IPFS CIDs.
- **`supabase/functions/nft-metadata/index.ts`**: Parse the expression field -- if it matches DSL format, include structured `conditions` array in metadata and skill.json.

---

## File Summary

| File | Action |
|------|--------|
| `src/lib/anchor-client.ts` | Add memo instruction helper |
| `src/components/MoveMint.tsx` | Add memo to verify step, DSL input, pass skill URIs |
| `supabase/functions/nft-metadata/index.ts` | Generate skill.json + SKILL.md alongside metadata |
| `src/lib/skill-dsl.ts` | New -- DSL parser/validator |
| `src/hooks/useMintedMoves.ts` | Add skillJsonUri, skillMdUri fields |
| `public/skill.md` | New -- root-level OpenClaw registry skill file |

## Technical Details

**Memo Program**: Program ID `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`. The instruction data is simply the UTF-8 encoded memo string. No additional accounts needed beyond the signer.

**DSL Grammar** (kept intentionally simple):
```text
<action>:<move_name> if <variable> <operator> <threshold>
<action>:<move_name> otherwise
```
Variables: `sentiment`, `proximity`, `tempo`, `energy`, `volume`. Operators: `>`, `<`, `>=`, `<=`, `==`.

**skill.json schema**:
```json
{
  "name": "move_name",
  "version": "1.0.0",
  "description": "...",
  "homepage": "https://moveregistry.lovable.app",
  "metadata": {
    "openclaw": {
      "category": "choreography",
      "mint": "<mint_pubkey>",
      "creator": "<wallet>",
      "royalty_bps": 500,
      "conditions": [...]
    }
  }
}
```


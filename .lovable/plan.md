
# Add Optional Description Field with Hackathon Example

Add an optional "Description" text input to the minting form so users can provide a human-readable description of their dance move. Include a pre-filled example button for quick hackathon demos.

---

## What You'll See

A new text input labeled "Description (optional)" will appear between the Move Name field and the Expression/DSL textarea. A small "Use example" pill button will auto-fill a hackathon-ready description. If left empty, the existing default (`"Dance move NFT: {moveName}"`) will be used as a fallback.

---

## Technical Details

**`src/components/MoveMint.tsx`**
- Add new state: `const [description, setDescription] = useState('')`
- Insert a new input field after Move Name (around line 393) with:
  - Label: "Description (optional)"
  - Placeholder: e.g. "A brief description of this dance move..."
  - A small "Use example" pill button that fills in a hackathon-ready description like: `"An expressive choreography skill that reacts to audience sentiment and proximity, blending chest pops and waves into an emergent dance routine for AI agents."`
- Replace the hardcoded `description: \`Dance move NFT: ${moveName}\`` in both mint paths (~line 111 and USDC path) with `description || \`Dance move NFT: ${moveName}\``
- Pass `description` through `onMintSuccess` callback

**`src/components/MoveMint.tsx` onMintSuccess type**
- Add optional `description?: string` to the callback type

**`supabase/functions/nft-metadata/index.ts`**
- Already accepts `description` from the request body -- no changes needed

**`src/hooks/useMintedMoves.ts`**
- No DB column change needed; the description is already stored in the NFT metadata JSON, not separately in the DB

No new dependencies or migrations needed.

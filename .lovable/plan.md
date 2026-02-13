
# Add Optional Video Hash Field

Add a separate, optional "Video Hash" input field to the minting form for users who want to attach an IPFS video CID alongside their Expression/DSL.

---

## What You'll See

A new text input labeled "Video Hash (optional)" will appear between the Expression/DSL textarea and the Royalty slider. It will accept an IPFS CID or video reference link. The existing Expression field remains required and unchanged.

---

## Technical Details

**`src/components/MoveMint.tsx`**
- Add new state: `const [videoHashCid, setVideoHashCid] = useState('')`
- Add a new input field after the Expression/DSL section (after line ~433, before the Royalty slider) with:
  - Label: "Video Hash (optional)"
  - Placeholder: e.g. `QmXyz... or IPFS video CID`
  - Styled consistently with the Move Name input
  - Not required
- When minting, pass `videoHashCid` alongside `videoHash` in the metadata call and `onMintSuccess` callback

**`supabase/functions/nft-metadata/index.ts`**
- Accept optional `videoHashCid` from the request body
- If provided, add it as an additional attribute: `{ trait_type: "Video CID", value: videoHashCid }`
- Include it in the SKILL.md output under a "Video" section

**`src/hooks/useMintedMoves.ts`**
- Add `videoHashCid` to the `MintedMove` type (optional field)
- Map it from/to a new `video_hash_cid` column if stored in DB

**Database migration**
- Add nullable `video_hash_cid TEXT` column to the `minted_moves` table

**`src/components/NFTCertificate.tsx`**
- Display "Video CID" if present in the move data

No new dependencies needed.

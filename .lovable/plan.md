

# Add "Use example" Button to Video Hash Field

Add a clickable "Use example" pill button next to the Video Hash label, matching the pattern already used for the Description field.

---

## What You'll See

A small "Use example" pill button will appear next to the "Video Hash (optional)" label. Clicking it fills the field with a realistic sample IPFS CID, making it easy to demo the full minting flow at a hackathon.

---

## Technical Details

**`src/components/MoveMint.tsx`**
- Wrap the existing "Video Hash (optional)" label in a flex row (same pattern as Description)
- Add a "Use example" pill button that calls `setVideoHashCid('bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')` -- a realistic-looking IPFS v1 CID
- Styled identically to the Description example button: `text-xs glass rounded-full px-2 py-1 cursor-pointer hover:bg-white/10`

No new files, dependencies, or migrations needed. Single file edit (~5 lines changed).


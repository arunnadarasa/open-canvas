

# Add "Skip for Judges" Button to Moltbook & Make It a Gate

## Problem

The Moltbook registration card appears but doesn't actually gate the minting form -- the Connect Wallet button and devnet instructions show regardless. The user wants Moltbook to be a mandatory step (like WorldID and ClawKey) that must be completed **or skipped** before the wallet connect / minting section appears.

## Changes

### `src/pages/Index.tsx`

1. **Gate the minting section behind Moltbook**: Move the devnet instructions and `MoveMint` component so they only render when `moltbookRegistered` is true (or skipped).

2. **Add "Skip for demo" button**: Add a text button below the MoltbookConnect card (similar to the existing ClawKey skip pattern) that sets localStorage and state to bypass the gate.

3. **Update badge row**: The existing badge row already shows the Moltbook badge when registered -- no changes needed there.

### Specific code changes

**Render logic update** (around lines 159-184):

```text
{worldIdVerified && clawKeyVerified && !moltbookRegistered && !moltbookChecking && (
  <div className="space-y-3">
    <MoltbookConnect ... />
    <button onClick={skipMoltbook}>
      Skip for demo (judges)
    </button>
  </div>
)}

{worldIdVerified && clawKeyVerified && (moltbookRegistered || moltbookChecking === false && moltbookRegistered) && (
  <div className="space-y-4">
    {/* devnet instructions */}
    {/* MoveMint */}
  </div>
)}
```

Simplified: the devnet instructions + MoveMint only render when all three gates pass (worldId + clawKey + moltbook).

**Skip handler**:
```text
const skipMoltbook = () => {
  localStorage.setItem('moltbook_registered', 'true');
  setMoltbookRegistered(true);
};
```

This reuses the same localStorage key so skipping is persistent across sessions. The "Skip for demo" button will be styled as a subtle text link, matching the existing skip pattern used for ClawKey.

No other files need changes.


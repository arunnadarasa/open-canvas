

# Make ClawKey Mandatory Gate (with Skip Option)

Move ClawKey verification to the top of the Mint section as a mandatory step (like World ID), with a "Skip for demo" bypass for hackathon judges.

---

## Changes

### 1. `src/components/ClawKeyRegister.tsx`

- Add a new prop: `onVerified: () => void` (callback when verified or skipped)
- When not verified, show a full-width gate card (similar to the World ID gate style) with:
  - Title, description, "Register Agent with ClawKey" button
  - A "Skip for demo (hackathon judges)" text button below, matching World ID's skip style
  - Skip sets `localStorage.setItem('clawkey_verified', 'true')` and calls `onVerified()`
- Remove the current optional card layout; use the centered gate style matching `WorldIDVerify`
- When verified (either real or skipped), show the existing inline badge

### 2. `src/pages/Index.tsx`

- Add `clawKeyVerified` state initialized from `localStorage.getItem('clawkey_verified') === 'true'` or from the database check
- Move `ClawKeyRegister` above the `MoveMint` component, right after World ID verification
- Only show ClawKey gate when `worldIdVerified` is true but `clawKeyVerified` is false
- Show the ClawKey badge next to the World ID badge in the header when verified
- Pass `onVerified` callback to update `clawKeyVerified` state
- Pass `isClawKeyVerified` (or similar) to `MoveMint` so minting is blocked until both gates pass

### 3. `src/components/MoveMint.tsx`

- Accept a new prop like `isClawKeyVerified` (boolean)
- Disable the mint button unless both `isWorldIDVerified` and `isClawKeyVerified` are true

---

## Flow After Changes

1. User sees World ID gate first
2. After World ID passes (or skip), ClawKey gate appears
3. After ClawKey passes (or skip), the mint form is unlocked
4. Both badges appear in the section header when verified

---

## Files to Change

| File | Action |
|------|--------|
| `src/components/ClawKeyRegister.tsx` | Redesign as mandatory gate with skip button |
| `src/pages/Index.tsx` | Add state, reorder components, show badges |
| `src/components/MoveMint.tsx` | Accept and enforce `isClawKeyVerified` prop |


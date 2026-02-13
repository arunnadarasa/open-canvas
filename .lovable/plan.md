

# Show Faucet Info Only After ClawKey Verification

Move the devnet faucet info box (lines 117-129 in `src/pages/Index.tsx`) so it only appears once both World ID and ClawKey gates have been passed.

---

## Change

### `src/pages/Index.tsx`

Move the faucet info `div` (the glass box with Wallet icon, devnet SOL/USDC links) from its current position (always visible) to inside the `{worldIdVerified && clawKeyVerified && (...)}` block, just above `MoveMint`. This way users only see faucet instructions once they've completed both verification gates.

**Before:**
```
faucet info (always shown)
World ID gate (if not verified)
ClawKey gate (if World ID done)
MoveMint (if both done)
```

**After:**
```
World ID gate (if not verified)
ClawKey gate (if World ID done)
faucet info + MoveMint (if both done)
```

---

## Files to Change

| File | Action |
|------|--------|
| `src/pages/Index.tsx` | Move faucet info block inside the `worldIdVerified && clawKeyVerified` conditional |




## NFT Certificates & Automatic Royalties

Add a certificate gallery and royalty tracker below the mint section. Newly minted moves get added to the list in real-time. Pre-seeded with mock data so the page looks populated on first load.

### New Components

**1. `src/components/NFTCertificate.tsx`** -- Single certificate card
- Glassmorphism card with gradient border accent
- Shows: move name, creator address (truncated), royalty %, mint date, tx link, payment method badge
- Hover effect: lift + glow
- "View Certificate" expand that shows full details (video hash, verification status)

**2. `src/components/CertificateGallery.tsx`** -- Gallery section
- Grid of NFTCertificate cards (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Header with count badge ("12 Moves Registered")
- Uses shared state from a context/store

**3. `src/components/RoyaltyTracker.tsx`** -- Royalty dashboard widget
- Shows mock royalty earnings with animated counter
- Mini table: recent royalty payments (mock data: "Chest Pop licensed by @dancer42 -- $0.50 USDC")
- Total earned, pending payouts
- Gradient progress bar for "next payout threshold"

### State Management

**4. `src/hooks/useMintedMoves.ts`** -- Custom hook
- Stores minted moves in React state + localStorage for persistence
- Interface: `MintedMove { id, moveName, videoHash, royalty, creator, txSignature, paymentMethod, mintedAt, verified }`
- Pre-seeded with 3 mock entries on first load
- `addMove()` function called after successful mint in MoveMint.tsx

### Integration Changes

**5. `src/components/MoveMint.tsx`** -- Wire up
- Import `useMintedMoves` hook
- After successful mint (both SOL and USDC flows), call `addMove()` with the mint data
- Pass the hook down via props or use it in Index.tsx

**6. `src/pages/Index.tsx`** -- Layout
- Add CertificateGallery section between the mint card and feature cards
- Add RoyaltyTracker as a sidebar-style widget or inline section
- Both use the shared `useMintedMoves` hook

### Mock Data (3 pre-seeded entries)

| Move Name | Creator | Royalty | Payment | Date |
|-----------|---------|---------|---------|------|
| Asura's Chest Pop | H32Y...Phjb | 10% | USDC | 2 days ago |
| Liquid Wave Arms | 9xKm...4rTz | 7% | SOL | 5 days ago |
| Freeze Frame Drop | UjxY...RD5o | 15% | USDC | 1 week ago |

### Mock Royalty Data

- Total earned: $4.27 USDC
- 5 recent license events with timestamps, licensee addresses, and amounts
- Animated counter on page load

### Visual Design

- Certificate cards: glass background, small gradient accent stripe on left edge, Award icon
- Royalty tracker: glass card with gradient stats row at top, mini transaction list below
- All animations consistent with existing shimmer/slide-up-fade system
- New entries animate in with a highlight pulse when freshly minted

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/useMintedMoves.ts` | Create -- shared state + localStorage |
| `src/components/NFTCertificate.tsx` | Create -- single cert card |
| `src/components/CertificateGallery.tsx` | Create -- gallery grid |
| `src/components/RoyaltyTracker.tsx` | Create -- royalty dashboard |
| `src/components/MoveMint.tsx` | Modify -- call addMove on success |
| `src/pages/Index.tsx` | Modify -- add gallery + royalty sections |


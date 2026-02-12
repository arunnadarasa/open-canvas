

# Add Tech Stack Section to Landing Page

## What

Add a visually appealing "Powered By" / "Tech Stack" section to the Index page showcasing the key technologies: Privy, Helius, Metaplex, World ID, x402, Solana, and shadcn/ui.

## Design

A grid of tech cards between the Feature Cards and Footer sections, each showing the technology name, a brief one-liner description, and an icon or emoji. Styled consistently with the existing glass-card aesthetic.

## Technologies to Feature

| Tech | Description |
|------|-------------|
| Solana | High-speed blockchain for NFT minting |
| Metaplex | On-chain NFT metadata standard |
| Helius | Real-time webhook and RPC infrastructure |
| Privy | Wallet authentication and onboarding |
| World ID | Proof-of-personhood verification |
| x402 | Micropayment-gated skill verification |
| Lovable Cloud | Backend functions and data storage |
| shadcn/ui | Accessible UI component library |

## Technical Details

### File Modified
- `src/pages/Index.tsx` -- add a new `TechStackSection` between the Feature Cards and Footer

### Implementation
- Create a `TechStackCard` component (inline in Index.tsx) similar to the existing `FeatureCard` pattern
- Use Lucide icons where available (e.g., `Cpu`, `Globe`, `Shield`, `Layers`, `Database`) and fallback to emoji for others
- Each card links to the technology's website via `target="_blank"`
- Responsive grid: 2 columns on mobile, 4 columns on desktop
- Same `glass-strong` + `animate-slide-up-fade` styling as existing cards
- Section header: "Built With" with a gradient icon


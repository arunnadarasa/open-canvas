

# Add Phantom Devnet Setup Instructions

Add a visible info/helper box in the Mint section that tells users how to set up their Phantom wallet for devnet testing, including enabling developer mode and getting free SOL.

---

## What You'll See

A subtle informational callout will appear inside the Mint section (below the heading, above the form fields) with three clear steps:

1. Enable Phantom devnet: Settings > Developer Settings > Testnet Mode
2. Ensure at least 0.1 SOL on devnet
3. A direct link to the Solana Faucet (https://faucet.solana.com/) to get free devnet SOL

Styled as a compact glass card with an info/wallet icon, consistent with the existing design language.

---

## Technical Details

**`src/pages/Index.tsx`**
- Add a small instructional callout block inside the Mint section, between the heading row and the `WorldIDVerify` / `MoveMint` components (around line 109)
- Content:
  - Icon: `Wallet` from lucide-react (already imported)
  - Text: "To mint on devnet, enable Testnet Mode in Phantom (Settings > Developer Settings), and ensure you have at least 0.1 SOL."
  - Link: "Get free devnet SOL" pointing to `https://faucet.solana.com/` (opens in new tab, styled with `ExternalLink` icon)
- Styled with `glass rounded-xl p-4 mb-4 text-sm text-muted-foreground` to keep it informational and non-intrusive

Single file edit, no new dependencies or migrations.


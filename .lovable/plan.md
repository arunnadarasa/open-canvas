

# Add USDC Devnet Faucet Instructions

Add a second line to the existing devnet setup callout mentioning USDC requirements and linking to Circle's faucet.

---

## What You'll See

The existing glass info card in the Mint section will gain a second instruction line: "To pay with USDC, ensure you have devnet USDC in your wallet." with a link to Circle's faucet at https://faucet.circle.com/.

---

## Technical Details

**`src/pages/Index.tsx`**
- Inside the existing devnet callout `<div>`, after the SOL faucet link, add:
  - A `<p>` explaining: "To pay with USDC, get devnet USDC from Circle's faucet (select Solana and Devnet)."
  - A styled link to `https://faucet.circle.com/` with the `ExternalLink` icon, matching the SOL faucet link style

Single file edit, ~3 lines added. No new dependencies or migrations.


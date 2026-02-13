

# Improve Mobile UX for "Mint Your Move" Section

Based on the screenshot, there are several mobile UX issues to fix:

1. The heading row ("Mint Your Move" + "Human Verified" badge) is cramped on small screens
2. The "Phantom wallet not detected" warning shows even on mobile where users access via Phantom's in-app browser (where `window.solana` may load slightly differently)
3. The devnet info card text is dense on small screens
4. The connect button and form inputs could use better mobile spacing

---

## What You'll See

- The heading and "Human Verified" badge will stack vertically on mobile instead of being side-by-side
- The devnet setup info card will use slightly smaller text and tighter spacing on mobile
- The "Phantom wallet not detected" warning will be softened -- on mobile it will say "If using Phantom mobile, open this page in Phantom's built-in browser" instead of just telling users to install an extension
- Form inputs, buttons, and the payment toggle will have better touch-friendly sizing
- The Connect Wallet button will be full-width on mobile

---

## Technical Details

**`src/pages/Index.tsx`** -- Mint section header:
- Change the heading row from `flex items-center justify-between` to `flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3` so the badge wraps below the title on narrow screens
- Reduce section padding from `p-6 sm:p-8` (already responsive, keep as-is)

**`src/components/MoveMint.tsx`** -- Wallet detection and connect UX:
- Update the Phantom-not-detected warning (lines 332-337): Instead of just "Please install Phantom extension", show a more helpful message that accounts for mobile: "On mobile, open this page inside the Phantom app's browser. On desktop, install the Phantom browser extension."
- Make the Connect Wallet button always full-width on mobile: change `w-full sm:w-auto` (already correct, keep)
- Add `text-sm` to the "Connect your wallet to mint..." prompt for mobile readability

**`src/pages/Index.tsx`** -- Devnet info card:
- Make the card text slightly more compact: reduce inner padding on mobile with `p-3 sm:p-4`
- Add `text-xs sm:text-sm` to scale the text down on small screens

These are small targeted tweaks across 2 files, no new dependencies or migrations.


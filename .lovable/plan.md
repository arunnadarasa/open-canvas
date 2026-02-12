

## Fix: "Wallet not available (no Solana wallet connected)"

### Problem
The user is authenticated via Phantom Solana (address `UjxYKRD5ogZLPSASPPTDZt48gYLJgMG2Cw6Gm4fePa8`), but the `useWallets()` hook doesn't return a matching Solana wallet object. The `getWallet()` filtering logic fails, blocking minting.

### Root Cause
Privy's `useWallets()` may not populate for externally-connected Solana wallets the same way as embedded wallets. However, the authenticated `user` object already contains the wallet address at `user.wallet.address`.

### Solution
Simplify the wallet resolution in `MoveMint.tsx`:

1. **Remove the `getWallet()` filtering logic** -- it's fragile and unnecessary
2. **Get the wallet address directly from `user.wallet.address`** -- Privy already provides this on authentication
3. **Use `signTransaction` with the address string** -- Privy's `signTransaction` only needs the address, not a wallet object
4. **Remove the `useWallets` and `useConnectWallet` imports** -- no longer needed

### Technical Details

In `src/components/MoveMint.tsx`:

- Remove `useWallets` and `useConnectWallet` imports and hooks
- Remove the `getWallet` callback and related `connectedWallet`/`connectedAddress`/`isEthereumWallet` variables
- In `mintMove`, get address from `user?.wallet?.address` instead of the wallet object
- Keep the Ethereum address check (`startsWith('0x')`) as a safety guard
- Keep all existing `signTransaction` logic (it already accepts `address` as a string)

This is a minimal, targeted fix -- only the wallet resolution logic changes. The transaction building, signing, and UI remain the same.


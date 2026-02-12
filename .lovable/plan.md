

## Fix: "No wallet found for address" - Sign directly with Phantom

### Problem
Privy's `useSignTransaction` hook internally maintains a wallet registry. For externally connected Solana wallets (like Phantom), the wallet object isn't always registered there, causing "No wallet found for address" even though authentication succeeds.

### Solution
Bypass Privy's `signTransaction` hook entirely and sign transactions directly using Phantom's browser provider (`window.solana`). This is reliable because:
- The user is already authenticated with Phantom
- Phantom's provider is available in the browser
- We already verify Phantom is installed during connection

### Changes in `src/components/MoveMint.tsx`

1. **Remove** the `useSignTransaction` import and hook
2. **Replace** the signing logic in `mintMove`:
   - Instead of calling Privy's `signTransaction({ transaction, connection, address })`, call `window.solana.signTransaction(transaction)` directly
   - Then serialize and send the signed transaction as before
3. **Add** a check that `window.solana` (Phantom provider) is available before signing
4. **Update** the `useCallback` dependency array to remove `signTransaction`

### Technical Detail

The signing block changes from:
```
const signedTx = await signTransaction({ transaction, connection, address: walletAddress })
```
to:
```
const phantom = (window as any).solana
if (!phantom?.signTransaction) throw new Error('Phantom wallet not available for signing')
const signedTx = await phantom.signTransaction(transaction)
```

Everything else (transaction building, serialization, sending, UI) stays the same.


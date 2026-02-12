

# Fix Metaplex "Missing Signature" Error

## Problem

The Metaplex `createV1` instruction requires the **mint account** to be a signer (since it's creating metadata for that mint). Currently, only the user's wallet (Phantom) signs the metadata transaction -- the mint keypair's signature is missing, causing: *"Missing signature for public key [7j1JuUico7...]"*.

## Solution

Add `partialSign(mintKeypair)` to the Metaplex metadata transaction before sending it to Phantom for the user's signature -- the same pattern already used for the Anchor mint step.

## Changes

### `src/components/MoveMint.tsx`

Before line 119 (`phantom.signTransaction(web3Tx)`), add:

```
web3Tx.partialSign(mintKeypair);
```

This ensures the mint keypair signs first, then Phantom adds the user's signature.

### `src/lib/metaplex.ts`

No changes needed -- the transaction is already correctly built with `createNoopSigner(mint)` which marks the mint as a required signer.

## Files Modified
- `src/components/MoveMint.tsx` -- add `web3Tx.partialSign(mintKeypair)` before Phantom signing


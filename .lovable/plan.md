

# Fix Metaplex NullSigner Error

## Problem

`createUmi()` initializes without a signer identity, so when Umi tries to build the transaction internally, it hits the NullSigner fallback and throws.

## Solution

Instead of trying to use Umi's transaction builder end-to-end (which requires a Umi-compatible signer), we'll convert the Umi transaction to a web3.js `VersionedTransaction` and have Phantom sign it directly -- consistent with how the Anchor transaction is already handled.

## Changes

### `src/lib/metaplex.ts`

1. After calling `createV1(...)`, use Umi's `toTransaction()` to convert the built instruction into a web3.js-compatible transaction
2. Set a dummy signer identity on Umi using `signerIdentity(createNoopSigner(...))` so Umi can build the instruction without erroring -- the actual signing happens via Phantom
3. Export a function that returns a web3.js `Transaction` (or `TransactionInstruction[]`) instead of a Umi `TransactionBuilder`, so `MoveMint.tsx` can send it through Phantom's `signAndSendTransaction` just like the Anchor mint step

### `src/components/MoveMint.tsx`

Update the Metaplex metadata step to:
- Get back a standard web3.js Transaction from the helper
- Sign and send it via Phantom (same pattern as the Anchor mint step)
- Remove the Umi-specific transaction building/signing logic

## Technical Approach

```text
getUmi() changes:
  - Import signerIdentity from @metaplex-foundation/umi
  - After createUmi(endpoint).use(mplTokenMetadata()), call .use(signerIdentity(creatorNoopSigner))
  - This satisfies Umi's internal requirement without actually signing

buildCreateMetadataInstruction() changes:
  - Set signerIdentity on Umi to the creator's noop signer
  - Build the transaction via transactionBuilder.buildWithLatestBlockhash(umi)
  - Convert to a web3.js Transaction using toWeb3JsTransaction from umi-web3js-adapters
  - Return the web3.js Transaction for Phantom to sign

MoveMint.tsx changes:
  - Call the updated helper to get a web3.js Transaction
  - Send via Phantom's signAndSendTransaction (existing pattern)
```

## Files Modified
- `src/lib/metaplex.ts` -- set signerIdentity, return web3.js Transaction
- `src/components/MoveMint.tsx` -- use standard Phantom signing for Metaplex tx



# Add Metaplex NFT Metadata to MoveRegistry Minting

## Overview

After each on-chain mint via your Anchor program, we'll create a proper Metaplex Token Metadata NFT so the dance move shows up in wallets, explorers, and marketplaces with name, image, royalties, and attributes.

## Approach

We'll use Metaplex's **Token Metadata** program via the Umi SDK (`@metaplex-foundation/umi` + `@metaplex-foundation/mpl-token-metadata`). This attaches standard NFT metadata (name, symbol, URI, seller fee basis points) to the mint created by your Anchor program.

Since uploading metadata JSON requires a storage backend (Arweave/IPFS), we'll handle that via an edge function that builds and stores the metadata JSON, then returns the URI to the frontend for the `createV1` call.

## Steps

### 1. Install Metaplex packages
Add these dependencies:
- `@metaplex-foundation/umi`
- `@metaplex-foundation/umi-bundle-defaults`
- `@metaplex-foundation/mpl-token-metadata`
- `@metaplex-foundation/umi-web3js-adapters` (to convert between web3.js and Umi types)

### 2. Create `src/lib/metaplex.ts` helper
A utility that:
- Initializes a Umi instance connected to devnet
- Exports a `createNftMetadata()` function that builds a `createV1` instruction to attach metadata to the already-minted token
- Uses the mint keypair from the Anchor mint step
- Sets `sellerFeeBasisPoints` from the royalty slider (e.g., 5% = 500 basis points)
- Points `uri` to a JSON metadata file (hosted via edge function or hardcoded template initially)

### 3. Create `supabase/functions/nft-metadata/index.ts` edge function
An edge function that:
- Accepts move name, description, video hash, creator, royalty
- Builds a standard Metaplex JSON metadata object (name, description, image, attributes, external_url)
- Stores it in Lovable Cloud file storage and returns the public URL
- This URL becomes the `uri` for the on-chain metadata

### 4. Update `MoveMint.tsx` minting flow
After the Anchor `mintSkill` transaction confirms, add a second step:
- Call the `nft-metadata` edge function to get a metadata URI
- Build and sign a Metaplex `createV1` transaction using Umi
- This attaches the metadata to the existing mint so it shows as a proper NFT

### 5. Update `NFTCertificate.tsx` display
Show the Metaplex metadata URI link so users can view the full NFT metadata on-chain.

## Technical Details

### New packages
```text
@metaplex-foundation/umi
@metaplex-foundation/umi-bundle-defaults
@metaplex-foundation/mpl-token-metadata
@metaplex-foundation/umi-web3js-adapters
```

### Metaplex metadata JSON format
```text
{
  "name": "Asura's Signature Chest Pop",
  "symbol": "MOVE",
  "description": "Dance move NFT minted on MoveRegistry",
  "image": "",
  "external_url": "https://moveregistry.lovable.app",
  "attributes": [
    { "trait_type": "Creator", "value": "<wallet>" },
    { "trait_type": "Royalty", "value": "5%" },
    { "trait_type": "Video Hash", "value": "<hash>" }
  ],
  "properties": {
    "category": "video",
    "creators": [{ "address": "<wallet>", "share": 100 }]
  }
}
```

### Files changed
- **New**: `src/lib/metaplex.ts` -- Umi setup and createV1 helper
- **New**: `supabase/functions/nft-metadata/index.ts` -- metadata JSON hosting
- **Modified**: `src/lib/anchor-client.ts` -- export mint keypair for Metaplex reuse
- **Modified**: `src/components/MoveMint.tsx` -- add Metaplex metadata step after Anchor mint
- **Modified**: `src/components/NFTCertificate.tsx` -- show metadata URI

### Flow after changes
```text
1. User fills form (name, video hash, royalty)
2. Anchor mintSkill transaction -> creates mint + skill PDA
3. Edge function generates metadata JSON -> returns URI
4. Metaplex createV1 transaction -> attaches metadata to mint
5. Payment (USDC/SOL) as before
6. NFT appears in wallets with full metadata
```


import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createV1,
  TokenStandard,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  percentAmount,
  createNoopSigner,
  type Umi,
  type TransactionBuilder,
} from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';
import type { PublicKey } from '@solana/web3.js';

let _umi: Umi | null = null;

export function getUmi(): Umi {
  if (!_umi) {
    const endpoint = import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com';
    _umi = createUmi(endpoint).use(mplTokenMetadata());
  }
  return _umi;
}

/**
 * Build a Metaplex createV1 instruction to attach NFT metadata
 * to an already-existing mint account.
 *
 * Returns an unsigned Umi TransactionBuilder — the caller must
 * convert it to a legacy Transaction and have Phantom sign it.
 */
export function buildCreateMetadataInstruction(params: {
  mintPublicKey: PublicKey;
  creatorPublicKey: PublicKey;
  name: string;
  symbol?: string;
  uri: string;
  sellerFeeBasisPoints: number;
}): TransactionBuilder {
  const umi = getUmi();

  const mint = fromWeb3JsPublicKey(params.mintPublicKey);
  const creatorKey = fromWeb3JsPublicKey(params.creatorPublicKey);
  const creatorSigner = createNoopSigner(creatorKey);

  return createV1(umi, {
    mint: createNoopSigner(mint),
    authority: creatorSigner,
    payer: creatorSigner,
    updateAuthority: creatorKey,
    name: params.name,
    symbol: params.symbol || 'MOVE',
    uri: params.uri,
    sellerFeeBasisPoints: percentAmount(params.sellerFeeBasisPoints / 100),
    tokenStandard: TokenStandard.NonFungible,
    creators: [
      {
        address: creatorKey,
        verified: true,
        share: 100,
      },
    ],
  });
}

/**
 * Fetch a metadata URI from the nft-metadata edge function.
 */
export async function fetchMetadataUri(params: {
  moveName: string;
  description: string;
  videoHash: string;
  creator: string;
  royaltyPercent: number;
}): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/nft-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metadata upload failed: ${text}`);
  }

  const data = await res.json();
  return data.uri;
}

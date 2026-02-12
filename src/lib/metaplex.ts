import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  createV1,
  TokenStandard,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import {
  percentAmount,
  createNoopSigner,
  signerIdentity,
  type Umi,
} from '@metaplex-foundation/umi';
import { fromWeb3JsPublicKey, toWeb3JsLegacyTransaction } from '@metaplex-foundation/umi-web3js-adapters';
import type { PublicKey, Transaction } from '@solana/web3.js';

let _umi: Umi | null = null;

export function getUmi(): Umi {
  if (!_umi) {
    const endpoint = import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com';
    _umi = createUmi(endpoint).use(mplTokenMetadata());
  }
  return _umi;
}

/**
 * Build a Metaplex createV1 transaction to attach NFT metadata
 * to an already-existing mint account.
 *
 * Returns a web3.js Transaction ready for Phantom to sign.
 */
export async function buildCreateMetadataTransaction(params: {
  mintPublicKey: PublicKey;
  creatorPublicKey: PublicKey;
  name: string;
  symbol?: string;
  uri: string;
  sellerFeeBasisPoints: number;
}): Promise<Transaction> {
  const umi = getUmi();

  const mint = fromWeb3JsPublicKey(params.mintPublicKey);
  const creatorKey = fromWeb3JsPublicKey(params.creatorPublicKey);
  const creatorSigner = createNoopSigner(creatorKey);

  // Set the signer identity so Umi can build the transaction without NullSigner error
  umi.use(signerIdentity(creatorSigner));

  const builder = createV1(umi, {
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

  // Build with latest blockhash and convert to web3.js Transaction
  const umiTx = await builder.buildWithLatestBlockhash(umi);
  return toWeb3JsLegacyTransaction(umiTx);
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

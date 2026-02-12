import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MintedMove {
  id: string;
  moveName: string;
  videoHash: string;
  royalty: number;
  creator: string;
  txSignature: string;
  paymentMethod: 'usdc' | 'sol';
  mintedAt: string;
  verified: boolean;
  mintPubkey?: string;
  skillPda?: string;
}

export function useMintedMoves() {
  const [moves, setMoves] = useState<MintedMove[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch moves from database
  const fetchMoves = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('minted_moves')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching moves:', error);
      setLoading(false);
      return;
    }

    const mapped: MintedMove[] = (data || []).map((row: any) => ({
      id: row.id,
      moveName: row.move_name,
      videoHash: row.expression || '',
      royalty: row.royalty_percent,
      creator: row.creator_wallet,
      txSignature: row.tx_signature || '',
      paymentMethod: (row.payment_method || 'usdc') as 'usdc' | 'sol',
      mintedAt: row.created_at,
      verified: row.verified,
      mintPubkey: row.mint_pubkey || undefined,
      skillPda: row.skill_pda || undefined,
    }));

    setMoves(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMoves();
  }, [fetchMoves]);

  const addMove = useCallback(async (move: {
    moveName: string;
    videoHash: string;
    royalty: number;
    creator: string;
    txSignature: string;
    paymentMethod: 'usdc' | 'sol';
    mintPubkey?: string;
    skillPda?: string;
  }) => {
    const { data, error } = await supabase
      .from('minted_moves')
      .insert({
        creator_wallet: move.creator,
        move_name: move.moveName,
        expression: move.videoHash,
        royalty_percent: move.royalty,
        mint_pubkey: move.mintPubkey || null,
        skill_pda: move.skillPda || null,
        tx_signature: move.txSignature,
        payment_method: move.paymentMethod,
        verified: move.paymentMethod === 'usdc', // x402 verified
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting move:', error);
      return;
    }

    if (data) {
      const newMove: MintedMove = {
        id: data.id,
        moveName: data.move_name,
        videoHash: data.expression || '',
        royalty: data.royalty_percent,
        creator: data.creator_wallet,
        txSignature: data.tx_signature || '',
        paymentMethod: (data.payment_method || 'usdc') as 'usdc' | 'sol',
        mintedAt: data.created_at,
        verified: data.verified,
        mintPubkey: data.mint_pubkey || undefined,
        skillPda: data.skill_pda || undefined,
      };
      setMoves((prev) => [newMove, ...prev]);
    }
  }, []);

  return { moves, addMove, loading, refetch: fetchMoves };
}

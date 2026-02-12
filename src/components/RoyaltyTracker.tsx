import { useEffect, useState, useCallback } from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';

interface RoyaltyEvent {
  id: string;
  mint_pubkey: string;
  payer_wallet: string;
  amount: number;
  royalty_amount: number;
  tx_signature: string;
  created_at: string;
}

const PAYOUT_THRESHOLD = 10;

export default function RoyaltyTracker({ walletAddress }: { walletAddress?: string }) {
  const [events, setEvents] = useState<RoyaltyEvent[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [counter, setCounter] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRoyalties = useCallback(async () => {
    setLoading(true);

    // Get all minted moves by this wallet to find their mints
    let mintPubkeys: string[] = [];
    if (walletAddress) {
      const { data: moves } = await supabase
        .from('minted_moves')
        .select('mint_pubkey')
        .eq('creator_wallet', walletAddress);
      mintPubkeys = (moves || []).map((m: any) => m.mint_pubkey).filter(Boolean);
    }

    // Get royalty events for those mints
    let query = supabase.from('royalty_events').select('*').order('created_at', { ascending: false });
    if (mintPubkeys.length > 0) {
      query = query.in('mint_pubkey', mintPubkeys);
    }

    const { data, error } = await query.limit(50);
    if (error) {
      console.error('Error fetching royalties:', error);
      setLoading(false);
      return;
    }

    const royaltyEvents = (data || []) as RoyaltyEvent[];
    setEvents(royaltyEvents);

    // Calculate total (amount is in raw token units, assume 6 decimals for USDC)
    const total = royaltyEvents.reduce((sum, e) => sum + (e.royalty_amount / 1_000_000), 0);
    setTotalEarned(total);
    setLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    fetchRoyalties();
  }, [fetchRoyalties]);

  // Animated counter
  useEffect(() => {
    if (totalEarned === 0) {
      setCounter(0);
      return;
    }
    const duration = 1200;
    const steps = 30;
    const increment = totalEarned / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= totalEarned) {
        setCounter(totalEarned);
        clearInterval(interval);
      } else {
        setCounter(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [totalEarned]);

  const pendingAmount = totalEarned * 0.3; // Estimate pending

  return (
    <div className="glass-strong rounded-2xl overflow-hidden">
      {/* Header gradient bar */}
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--gradient-solana-purple))] to-[hsl(var(--gradient-solana-green))]" />

      <div className="p-5 space-y-5">
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-solana-purple))] to-[hsl(var(--gradient-solana-green))] flex items-center justify-center">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold">Royalty Earnings</h3>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold gradient-text">${counter.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Total Earned</p>
          </div>
          <div className="glass rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">${pendingAmount.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Pending</p>
          </div>
        </div>

        {/* Payout threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Next payout threshold</span>
            <span className="font-mono">${totalEarned.toFixed(2)} / ${PAYOUT_THRESHOLD}</span>
          </div>
          <Progress
            value={(totalEarned / PAYOUT_THRESHOLD) * 100}
            className="h-2 bg-white/5"
          />
        </div>

        {/* Recent royalties */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Recent Licenses
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {events.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground/50 text-center py-4">
                No royalty events yet. They'll appear here when your moves are licensed.
              </p>
            )}
            {loading && events.length === 0 && (
              <p className="text-xs text-muted-foreground/50 text-center py-4">Loading...</p>
            )}
            {events.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-muted-foreground truncate">
                  <span className="text-foreground font-medium">{r.mint_pubkey?.slice(0, 6)}...</span>
                  {' '}by {r.payer_wallet?.slice(0, 6)}...
                </span>
                <span className="shrink-0 ml-2 flex items-center gap-2">
                  <span className="text-primary font-mono font-medium">
                    ${(r.royalty_amount / 1_000_000).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground/50">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

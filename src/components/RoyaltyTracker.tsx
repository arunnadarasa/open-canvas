import { useEffect, useState } from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MOCK_ROYALTIES = [
  { licensee: '@dancer42', move: 'Chest Pop', amount: 0.50, time: '2h ago' },
  { licensee: '@bboy_king', move: 'Wave Arms', amount: 0.35, time: '8h ago' },
  { licensee: '@flowstate', move: 'Freeze Frame', amount: 0.75, time: '1d ago' },
  { licensee: '@popper99', move: 'Chest Pop', amount: 0.50, time: '2d ago' },
  { licensee: '@krumplife', move: 'Wave Arms', amount: 0.35, time: '3d ago' },
];

const TOTAL_EARNED = 4.27;
const PENDING = 1.82;
const PAYOUT_THRESHOLD = 10;

export default function RoyaltyTracker() {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = TOTAL_EARNED / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= TOTAL_EARNED) {
        setCounter(TOTAL_EARNED);
        clearInterval(interval);
      } else {
        setCounter(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

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
            <p className="text-2xl font-bold text-foreground">${PENDING.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Pending</p>
          </div>
        </div>

        {/* Payout threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Next payout threshold</span>
            <span className="font-mono">${TOTAL_EARNED.toFixed(2)} / ${PAYOUT_THRESHOLD}</span>
          </div>
          <Progress
            value={(TOTAL_EARNED / PAYOUT_THRESHOLD) * 100}
            className="h-2 bg-white/5"
          />
        </div>

        {/* Recent royalties */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Recent Licenses
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {MOCK_ROYALTIES.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-muted-foreground truncate">
                  <span className="text-foreground font-medium">{r.move}</span>
                  {' '}by {r.licensee}
                </span>
                <span className="shrink-0 ml-2 flex items-center gap-2">
                  <span className="text-primary font-mono font-medium">${r.amount.toFixed(2)}</span>
                  <span className="text-muted-foreground/50">{r.time}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

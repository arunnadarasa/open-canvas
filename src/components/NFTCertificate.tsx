import { useState } from 'react';
import { Award, ExternalLink, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MintedMove } from '@/hooks/useMintedMoves';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function NFTCertificate({ move, isNew }: { move: MintedMove; isNew?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`group glass-strong rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.3)] transition-all duration-500 ${
        isNew ? 'animate-slide-up-fade ring-2 ring-primary/40' : ''
      }`}
    >
      {/* Gradient accent stripe */}
      <div className="h-1 bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))]" />

      <div className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center shrink-0">
              <Award className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm gradient-text leading-tight">{move.moveName}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                {move.creator.slice(0, 4)}...{move.creator.slice(-4)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 border-white/10">
            {move.paymentMethod === 'usdc' ? '💵 USDC' : '◎ SOL'}
          </Badge>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Royalty: <span className="text-foreground font-medium">{move.royalty}%</span></span>
          <span>{timeAgo(move.mintedAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <a
            href={`https://solscan.io/tx/${move.txSignature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Solscan
          </a>
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="pt-3 border-t border-white/5 space-y-2 text-xs animate-slide-up-fade">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-foreground/70">Video Hash:</span>
              <span className="font-mono truncate">{move.videoHash}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {move.verified ? (
                <span className="inline-flex items-center gap-1 text-primary">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="text-yellow-400">Pending verification</span>
              )}
            </div>
            {move.metadataUri && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-foreground/70">Metadata:</span>
                <a
                  href={move.metadataUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 truncate transition-colors"
                >
                  View JSON ↗
                </a>
              </div>
            )}
            <div className="text-muted-foreground">
              Minted: {new Date(move.mintedAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

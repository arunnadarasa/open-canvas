import { Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import NFTCertificate from './NFTCertificate';
import type { MintedMove } from '@/hooks/useMintedMoves';

export default function CertificateGallery({ moves }: { moves: MintedMove[] }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
          <Award className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-2xl font-bold">Registered Moves</h2>
        <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
          {moves.length} Minted
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moves.map((move, i) => (
          <NFTCertificate
            key={move.id}
            move={move}
            isNew={move.id.startsWith('mint-') && i === 0}
          />
        ))}
      </div>

      {moves.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-8">
          No moves minted yet. Be the first to register a dance move!
        </p>
      )}
    </section>
  );
}

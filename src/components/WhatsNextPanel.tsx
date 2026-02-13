import { ShieldCheck, Fingerprint, Users, Sparkles, Check, ArrowRight } from 'lucide-react';

interface WhatsNextPanelProps {
  worldIdVerified: boolean;
  clawKeyVerified: boolean;
  moltbookRegistered: boolean;
}

const allSteps = [
  { key: 'worldid', label: 'Verify Personhood', desc: 'Prove you\'re human with World ID', icon: ShieldCheck },
  { key: 'clawkey', label: 'Register ClawKey', desc: 'Verify human ownership of your AI agent', icon: Fingerprint },
  { key: 'moltbook', label: 'Join Moltbook', desc: 'Connect to the dancetech social feed', icon: Users },
  { key: 'mint', label: 'Mint Your Move', desc: 'Create your on-chain dance skill NFT', icon: Sparkles },
];

export default function WhatsNextPanel({ worldIdVerified, clawKeyVerified, moltbookRegistered }: WhatsNextPanelProps) {
  const completed = [worldIdVerified, clawKeyVerified, moltbookRegistered, false];

  return (
    <div className="glass rounded-xl p-5 space-y-4 h-fit sticky top-8">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ArrowRight className="w-4 h-4 text-primary" />
        Verification Steps
      </h4>
      <div className="space-y-3">
        {allSteps.map((step, i) => {
          const Icon = step.icon;
          const done = completed[i];
          const isActive = !done && completed.slice(0, i).every(Boolean);

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 rounded-lg p-2.5 transition-all duration-200 ${
                isActive ? 'bg-primary/5 border border-primary/20' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  done
                    ? 'bg-accent/20'
                    : isActive
                    ? 'bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))]'
                    : 'bg-muted/50'
                }`}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-muted-foreground/40'}`} />
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${done ? 'text-accent line-through' : isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {step.label}
                </p>
                <p className={`text-xs ${done || isActive ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Why verify tip */}
      <div className="border-t border-border pt-3 mt-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">Why verify?</strong> Identity gates prevent spam mints, ensure one-person-one-identity, and create an auditable trail for AI skill licensing.
        </p>
      </div>
    </div>
  );
}

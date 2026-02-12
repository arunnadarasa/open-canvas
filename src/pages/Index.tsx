import { Award, ShieldCheck, Coins, Sparkles, Zap } from 'lucide-react';
import MoveMint from '../components/MoveMint';
import CertificateGallery from '../components/CertificateGallery';
import RoyaltyTracker from '../components/RoyaltyTracker';
import { useMintedMoves } from '../hooks/useMintedMoves';

function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  delay: string;
}) {
  return (
    <div 
      className="group glass-strong rounded-2xl p-6 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.3)] transition-all duration-500 opacity-0 animate-slide-up-fade"
      style={{ animationDelay: delay, animationFillMode: 'forwards' }}
    >
      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] group-hover:scale-110 transition-transform duration-300">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2 gradient-text">{title}</h3>
      <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </div>
  );
}

export default function Index() {
  const { moves, addMove } = useMintedMoves();

  return (
    <main className="min-h-screen bg-mesh text-foreground relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-[hsl(var(--gradient-cyan))] opacity-[0.04] blur-3xl animate-float" />
        <div className="absolute top-40 right-[15%] w-96 h-96 rounded-full bg-[hsl(var(--gradient-magenta))] opacity-[0.03] blur-3xl animate-float-reverse" />
        <div className="absolute bottom-20 left-[30%] w-64 h-64 rounded-full bg-[hsl(var(--gradient-solana-purple))] opacity-[0.04] blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero Section */}
        <header className="text-center mb-16 sm:mb-20">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] opacity-20 animate-glow-pulse scale-150" />
            <h1 className="relative text-5xl sm:text-7xl font-extrabold tracking-tight gradient-text opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              MoveRegistry
            </h1>
          </div>

          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            On-chain dance skill registry — turning human choreography into verifiable, licensable AI-agent skills
          </p>
          <p className="mt-2 text-sm text-muted-foreground/70 max-w-lg mx-auto opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Mint NFT certificates for your dance moves. License them to AI agents, metaverse avatars, and robots.
          </p>

          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground mt-6 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--gradient-solana-green))]" />
            <span>Powered by Solana + x402</span>
            <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gradient-cyan))]" />
          </div>

          <p className="mt-3 text-sm text-muted-foreground/60 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)
          </p>
        </header>

        {/* Mint Section */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 gradient-border mb-16 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Mint Your Move
          </h2>
          <MoveMint onMintSuccess={addMove} />
        </section>

        {/* Certificate Gallery + Royalty Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
          <div className="lg:col-span-2">
            <CertificateGallery moves={moves} />
          </div>
          <div>
            <RoyaltyTracker />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            icon={Award}
            title="NFT Certificates"
            description="Mint your choreography as an on-chain Skill NFT. Each certificate stores creator, expression (text DSL or video), and royalty terms."
            delay="0.8s"
          />
          <FeatureCard
            icon={ShieldCheck}
            title="x402 Verification"
            description="Pay $0.01 via x402 micropayment to verify skill authenticity. Prevents spam and establishes provenance through PayAI facilitator."
            delay="0.9s"
          />
          <FeatureCard
            icon={Coins}
            title="Automatic Royalties"
            description="When AI agents, metaverse platforms, or robot manufacturers license your skill, royalties auto-distribute to your treasury on-chain."
            delay="1.0s"
          />
        </section>

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-white/5">
          <p className="text-sm text-muted-foreground/60">
            OpenClaw Dance Skill Registry — Empowering dance creators with on-chain IP protection for AI agents and robots
          </p>
          <p className="mt-2">
            <a 
              href="https://github.com/arunnadarasa/moveregistry-solana-1770840012418" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              View Code on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

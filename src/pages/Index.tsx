import { useState, useEffect } from 'react';
import { Award, ShieldCheck, Coins, Sparkles, Zap, ChevronDown, Cpu, Globe, Shield, Layers, Database, Wallet, Component, ExternalLink, MessageCircleQuestion, Map, Fingerprint, Users } from 'lucide-react';
import MoltbookConnect from '../components/MoltbookConnect';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../components/ui/accordion';
import { usePrivy } from '@privy-io/react-auth';
import MoveMint from '../components/MoveMint';
import CertificateGallery from '../components/CertificateGallery';
import RoyaltyTracker from '../components/RoyaltyTracker';
import WorldIDVerify from '../components/WorldIDVerify';
import ClawKeyRegister from '../components/ClawKeyRegister';
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
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address || undefined;
  const [worldIdVerified, setWorldIdVerified] = useState(
    () => localStorage.getItem('worldid_verified') === 'true'
  );
  const [clawKeyVerified, setClawKeyVerified] = useState(
    () => localStorage.getItem('clawkey_verified') === 'true'
  );
  const [moltbookRegistered, setMoltbookRegistered] = useState(
    () => localStorage.getItem('moltbook_registered') === 'true'
  );

  // Auto-detect existing Moltbook registration from DB
  useEffect(() => {
    if (!walletAddress || localStorage.getItem('moltbook_registered') === 'true') return;
    import('@/integrations/supabase/client').then(({ supabase }) => {
      supabase
        .from('moltbook_agents_public')
        .select('wallet_address')
        .eq('wallet_address', walletAddress)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            localStorage.setItem('moltbook_registered', 'true');
            setMoltbookRegistered(true);
          }
        });
    });
  }, [walletAddress]);

  return (
    <main className="min-h-screen bg-mesh text-foreground relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-[10%] w-72 h-72 rounded-full bg-[hsl(var(--gradient-cyan))] opacity-[0.04] blur-3xl animate-float" />
        <div className="absolute top-40 right-[15%] w-96 h-96 rounded-full bg-[hsl(var(--gradient-magenta))] opacity-[0.03] blur-3xl animate-float-reverse" />
        <div className="absolute bottom-20 left-[30%] w-64 h-64 rounded-full bg-[hsl(var(--gradient-solana-purple))] opacity-[0.04] blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Video Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-dance.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[hsl(var(--background))]" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] opacity-20 animate-glow-pulse scale-150" />
            <h1 className="relative text-6xl sm:text-8xl font-extrabold tracking-tight gradient-text opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              MoveRegistry
            </h1>
          </div>

          <p className="mt-6 text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            On-chain dance skill registry — turning human choreography into verifiable, licensable AI-agent skills
          </p>
          <p className="mt-3 text-sm sm:text-base text-white/60 max-w-lg mx-auto opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            Mint NFT certificates for your dance moves. License them to AI agents, metaverse avatars, and robots.
          </p>

          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs font-medium text-white/80 mt-6 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <Zap className="w-3.5 h-3.5 text-[hsl(var(--gradient-solana-green))]" />
            <span>Powered by Solana + x402</span>
            <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gradient-cyan))]" />
          </div>

          <p className="mt-3 text-sm text-white/40 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)
          </p>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
          <ChevronDown className="w-8 h-8 text-white/60 animate-bounce-down" />
        </div>
      </section>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">

        {/* Mint Section */}
        <section className="glass-strong rounded-2xl p-6 sm:p-8 gradient-border mb-16 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              Mint Your Move
            </h2>
          <div className="flex items-center gap-2 flex-wrap">
            {worldIdVerified && <WorldIDVerify isVerified={true} onVerified={() => {}} />}
            {clawKeyVerified && <ClawKeyRegister walletAddress={walletAddress || null} onVerified={() => {}} isVerified={true} />}
            {moltbookRegistered && <MoltbookConnect walletAddress={walletAddress || null} isVerified={true} />}
          </div>
          </div>
          {!worldIdVerified && (
            <WorldIDVerify isVerified={false} onVerified={() => setWorldIdVerified(true)} />
          )}
          {worldIdVerified && !clawKeyVerified && (
            <ClawKeyRegister walletAddress={walletAddress || null} onVerified={() => setClawKeyVerified(true)} isVerified={false} />
          )}
          {worldIdVerified && clawKeyVerified && (
            <div className="space-y-4">
              {!moltbookRegistered && (
                <MoltbookConnect
                  walletAddress={walletAddress || null}
                  onRegistered={() => {
                    setMoltbookRegistered(true);
                    localStorage.setItem('moltbook_registered', 'true');
                  }}
                />
              )}
              <div className="glass rounded-xl p-3 sm:p-4 flex items-start gap-3 text-xs sm:text-sm text-muted-foreground">
                <Wallet className="w-5 h-5 shrink-0 mt-0.5 text-primary/60" />
                <div>
                  <p>To mint on devnet, enable <strong className="text-foreground">Testnet Mode</strong> in Phantom (Settings → Developer Settings) and ensure you have at least <strong className="text-foreground">0.1 SOL</strong>.</p>
                  <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
                    Get free devnet SOL <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="mt-2">To pay with USDC, get devnet USDC from Circle's faucet (select <strong className="text-foreground">Solana</strong> and <strong className="text-foreground">Devnet</strong>).</p>
                  <a href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-primary hover:text-primary/80 transition-colors underline underline-offset-4">
                    Get free devnet USDC <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <MoveMint onMintSuccess={addMove} isWorldIDVerified={worldIdVerified} isClawKeyVerified={clawKeyVerified} />
            </div>
          )}
        </section>

        {/* Certificate Gallery + Royalty Tracker */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 opacity-0 animate-slide-up-fade" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
          <div className="lg:col-span-2">
            <CertificateGallery moves={moves} />
          </div>
          <div>
            <RoyaltyTracker walletAddress={walletAddress} />
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

        {/* Tech Stack */}
        <section className="mb-16">
          <div className="text-center mb-8 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.1s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text">Built With</h2>
            </div>
            <p className="text-muted-foreground text-sm">The technologies powering MoveRegistry</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Cpu, name: 'Solana', desc: 'High-speed blockchain for NFT minting', url: 'https://solana.com' },
              { icon: Component, name: 'Metaplex', desc: 'On-chain NFT metadata standard', url: 'https://developers.metaplex.com' },
              { icon: Database, name: 'Helius', desc: 'Real-time webhook & RPC infrastructure', url: 'https://helius.dev' },
              { icon: Wallet, name: 'Privy', desc: 'Wallet authentication & onboarding', url: 'https://privy.io' },
              { icon: Globe, name: 'World ID', desc: 'Proof-of-personhood verification', url: 'https://worldcoin.org/world-id' },
              { icon: Shield, name: 'x402', desc: 'Micropayment-gated skill verification', url: 'https://www.x402.org' },
              { icon: Zap, name: 'Lovable Cloud', desc: 'Backend functions & data storage', url: 'https://lovable.dev' },
              { icon: Fingerprint, name: 'ClawKey', desc: 'Verifiable human ownership for AI agents', url: 'https://clawkey.ai' },
              { icon: Users, name: 'Moltbook', desc: 'Social network for AI agents — auto-posts minted moves', url: 'https://www.moltbook.com' },
              { icon: Component, name: 'shadcn/ui', desc: 'Accessible UI component library', url: 'https://ui.shadcn.com' },
            ].map((tech, i) => (
              <a
                key={tech.name}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group glass-strong rounded-2xl p-5 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.3)] transition-all duration-500 opacity-0 animate-slide-up-fade flex flex-col"
                style={{ animationDelay: `${1.2 + i * 0.08}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <tech.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-sm gradient-text">{tech.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">{tech.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Community Q&A */}
        <section className="mb-16">
          <div className="text-center mb-8 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.8s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
                <MessageCircleQuestion className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text">Community Q&A</h2>
            </div>
            <p className="text-muted-foreground text-sm">Technical questions from hackathon reviewers — answered</p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <a href="https://colosseum.com/agent-hackathon/forum/6330" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Forum Thread #6330 <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://colosseum.com/agent-hackathon/forum/5440" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Forum Thread #5440 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="glass-strong rounded-2xl p-6 sm:p-8 opacity-0 animate-slide-up-fade" style={{ animationDelay: '1.9s', animationFillMode: 'forwards' }}>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="q1" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How do you prevent false attribution if someone mints a move they didn't create?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  World ID proof-of-personhood prevents Sybil attacks (one person, one identity). The creator's wallet is permanently recorded on-chain in the SkillAccount PDA. On our roadmap: community challenge/dispute resolution via DAO governance, and video-hash anchoring so the original recording's content hash is embedded in the NFT metadata, making plagiarism detectable.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How does your system handle latency between a Helius webhook event and a royalty distribution?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Helius webhooks deliver enhanced transaction data in near real-time (typically under 2 seconds). The webhook writes royalty events to our database immediately. The actual royalty distribution happens atomically on-chain via the <code className="text-primary/80">license_skill</code> instruction and the treasury PDA — there is no off-chain delay in payment settlement. The webhook simply indexes the event for the dashboard UI.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How are you handling versioning if a choreographer updates a dance move's DSL?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  Each mint is an immutable NFT — the on-chain SkillAccount and Metaplex metadata are permanent records. To "update" a move, the creator mints a new version with an updated DSL expression. Roadmap: a version-chain field in <code className="text-primary/80">skill.json</code> linking new versions to their predecessor mint address, so agents can discover the latest version while preserving the full history.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How does your program verify the content hash of submitted choreography?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  The expression field (video IPFS CID or DSL text) is stored directly in the on-chain SkillAccount via the Anchor program. The Metaplex metadata and OpenClaw <code className="text-primary/80">skill.json</code> both reference this hash. Proof-of-payment is also embedded on-chain via Memo instructions (<code className="text-primary/80">x402:&lt;tx_hash&gt;</code>), creating an irrevocable link between payment, verification, and content.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How does the licensing flow work — one-time purchase or per-use royalties?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  The <code className="text-primary/80">license_skill</code> instruction on the MoveRegistry program supports per-use licensing. Each call transfers USDC from the licensee to the creator's token account via the treasury PDA. An oracle or self-reporting mechanism for off-chain usage tracking is on our roadmap, starting with Helius webhook indexing for on-chain events.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How do you handle disputes — e.g., a choreographer claims unauthorized use?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  All licensing transactions are recorded on-chain and indexed via Helius webhooks, providing a full audit trail. On the roadmap: DAO-based arbitration where staked community members can review disputes, and cryptographic attestation (similar to VRF execution proofs) to verify that an agent actually performed the licensed move before royalties are triggered.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q7" className="border-white/5">
                <AccordionTrigger className="text-sm text-left hover:no-underline">How do you solve spam/Sybil and authorship verification?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                  World ID (Worldcoin) proof-of-personhood is required before wallet connection or minting — one human = one verified identity. The x402 micropayment ($0.01 USDC) for verification adds an economic cost to spam. Together, these create a two-layer defense: identity verification + economic friction.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-16">
          <div className="text-center mb-8 opacity-0 animate-slide-up-fade" style={{ animationDelay: '2.0s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] flex items-center justify-center">
                <Map className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold gradient-text">Roadmap</h2>
            </div>
            <p className="text-muted-foreground text-sm">From MVP to mainnet — our development path</p>
          </div>
          <div className="relative space-y-4">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-[hsl(var(--gradient-cyan))] via-[hsl(var(--gradient-magenta))] to-[hsl(var(--gradient-solana-purple))] opacity-30 hidden sm:block" />
            {[
              { phase: 'Phase 1', label: 'Current MVP', items: ['NFT skill minting via Metaplex', 'World ID proof-of-personhood gate', 'x402 micropayment verification', 'Memo proofs on-chain', 'OpenClaw skill packages (skill.json + SKILL.md)', 'Conditional choreography DSL'] },
              { phase: 'Phase 2', label: 'Governance & Versioning', items: ['DAO governance for disputes and registry curation', 'Version-chaining for skill updates in skill.json', 'Off-chain usage oracle for per-use royalties'] },
              { phase: 'Phase 3', label: 'Marketplace & Attestation', items: ['Skill Marketplace for direct buy/sell/license', 'Cross-chain expansion via Wormhole', 'Cryptographic attestation for agent execution proofs'] },
              { phase: 'Phase 4', label: 'Full Launch', items: ['Robot dance competitions with licensed choreography', 'Full ClawHub integration', 'Mainnet launch'] },
            ].map((p, i) => (
              <div
                key={p.phase}
                className="glass-strong rounded-2xl p-5 sm:p-6 sm:ml-10 relative opacity-0 animate-slide-up-fade"
                style={{ animationDelay: `${2.1 + i * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="absolute left-[-30px] top-5 w-4 h-4 rounded-full bg-gradient-to-br from-[hsl(var(--gradient-cyan))] to-[hsl(var(--gradient-magenta))] border-2 border-background hidden sm:block" />
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/80">{p.phase}</span>
                  <span className="text-xs text-muted-foreground">— {p.label}</span>
                  {i === 0 && <span className="ml-auto text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--gradient-solana-green))]/20 text-[hsl(var(--gradient-solana-green))]">Live</span>}
                </div>
                <ul className="space-y-1.5">
                  {p.items.map(item => (
                    <li key={item} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Sparkles className="w-3 h-3 mt-1 shrink-0 text-primary/40" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>


        <footer className="text-center pt-8 border-t border-white/5">
          <p className="text-sm text-muted-foreground/60">
            OpenClaw Dance Skill Registry — Empowering dance creators with on-chain IP protection for AI agents and robots
          </p>
          <div className="mt-2 flex items-center justify-center gap-4">
            <a 
              href="https://github.com/arunnadarasa/moveregistry-solana-1770840012418" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              View Code on GitHub
            </a>
            <a 
              href="https://colosseum.com/agent-hackathon/projects/moveregistry" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            >
              View on Colosseum
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

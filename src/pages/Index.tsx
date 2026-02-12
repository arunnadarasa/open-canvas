import MoveMint from '../components/MoveMint';

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      padding: '1.5rem',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 style={{ marginBottom: '0.75rem', color: '#00dbde' }}>{title}</h3>
      <p style={{ opacity: 0.8, lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

export default function Index() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(90deg, #00dbde, #fc00ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            MoveRegistry
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.8 }}>
            On-chain attribution and verification for dance moves
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.5rem' }}>
            Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)
          </p>
        </header>

        <section style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: 12 }}>
          <h2 style={{ marginBottom: '1.5rem' }}>Mint Your Move</h2>
          <MoveMint />
        </section>

        <section style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard
            title="NFT Certificates"
            description="Each unique dance move is minted as an NFT with metadata including creator, video hash, and move name."
          />
          <FeatureCard
            title="x402 Verification"
            description="Pay a small fee to verify move authenticity. Prevents spam and ensures genuine attributions."
          />
          <FeatureCard
            title="Automatic Royalties"
            description="When others license your move, royalties automatically flow to your treasury via x402."
          />
        </section>

        <footer style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.6, fontSize: '0.9rem' }}>
          <p>MoveRegistry — Empowering dance creators with on-chain IP protection</p>
          <p style={{ marginTop: '0.5rem' }}>
            <a href="https://github.com/arunnadarasa/moveregistry-solana-1770840012418" target="_blank" rel="noopener noreferrer" style={{ color: '#00dbde' }}>
              View Code on GitHub
            </a>
          </p>
        </footer>
      </div>
    </main>
  )
}

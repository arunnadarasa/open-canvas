# 🩰 OpenClaw Dance Skill Registry (MoveRegistry)

**On-chain registry for dance skills on Solana — protect your choreography in the age of AI & robotics.**

> Built for the [Colosseum Agent Hackathon](https://www.colosseum.org/) by **Asura (RyuAsura Dojo)**

🌐 **Live**: [moveregistry.lovable.app](https://moveregistry.lovable.app)

---

## The Problem

Dancers and choreographers have no way to **prove authorship**, **license their moves**, or **earn royalties** as AI models and humanoid robots increasingly replicate human movement. Original choreography is copied freely with zero attribution or compensation.

## Our Solution

**MoveRegistry** lets creators mint **NFT certificates** for their dance skills on Solana, verify ownership via **x402 micropayments**, and earn **automatic royalties** whenever their moves are licensed by AI developers, metaverse platforms, or robot manufacturers.

---

## Features

- 🎬 **Cinematic Video Hero** — Full-viewport looping dance video background
- 🌍 **World ID Verification Gate** — Prove personhood before minting (Sybil resistance)
- 👛 **Solana Wallet Integration** — Connect Phantom wallet to sign transactions
- 🎖️ **NFT Skill Minting** — Mint on-chain certificates for choreography on Solana devnet
- 🖼️ **Certificate Gallery** — Browse all minted dance skill NFTs
- 💰 **Royalty Tracker** — Monitor earnings from licensed moves
- 🔐 **x402 / PayAI Verification** — Micropayment-gated skill verification

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Blockchain | Solana (devnet), Phantom wallet |
| Auth | Privy, World ID |
| Payments | x402 protocol / PayAI |
| Backend | Lovable Cloud (edge functions) |
| UI Components | shadcn/ui, Lucide icons |

---

## Architecture

```
┌─────────────────────────────┐
│     React SPA (Frontend)    │
│  Privy Auth · Phantom Wallet│
│  World ID · x402 Client     │
└──────────┬──────────────────┘
           │
    ┌──────▼──────┐
    │ Edge Functions│
    │  verify-worldid │ ← World ID proof verification
    │  x402-proxy     │ ← Payment signature proxy (CORS)
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   Solana     │
    │  (devnet)    │
    │  NFT Minting │
    └─────────────┘
```

---

## How It Works

1. **Verify Personhood** — Complete World ID verification to prove you're human
2. **Connect Wallet** — Link your Phantom wallet (Solana)
3. **Mint Skill NFT** — Name your dance move, pay a small mint fee, and receive an on-chain certificate
4. **Verify via x402** — AI developers pay a micropayment to verify skill authenticity
5. **Earn Royalties** — Automatic royalty distribution when your moves are licensed

---

## Business Model

| Revenue Stream | Description |
|---------------|-------------|
| **Mint Fee** | Small SOL fee to mint a skill certificate |
| **Verification Fee** | x402 micropayment for each skill verification |
| **Royalty Split** | Percentage of licensing revenue to original creators |

---

## Target Audience

- 💃 **Choreographers & Dancers** — Protect and monetize original moves
- 🤖 **AI Developers** — License authentic human movement data
- 🌐 **Metaverse Platforms** — Source verified dance animations
- 🏭 **Robot Manufacturers** — License choreography for humanoid robots

---

## Future Vision

- 🏛️ **DAO Governance** — Community-driven registry management
- 🛒 **Skill Marketplace** — Buy/sell/license dance moves directly
- 🌉 **Cross-Chain** — Expand via Wormhole to other chains
- 🤖 **Robot Dance Competitions** — Licensed choreography battles

---

## Development

```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm i
npm run dev
```

---

## License

MIT

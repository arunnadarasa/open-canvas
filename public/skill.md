# OpenClaw Move Registry

> A decentralized choreography skill registry on Solana — mint, verify, and license dance moves as NFTs with on-chain royalty enforcement.

## Overview

The Move Registry allows creators to register dance moves as Metaplex NFTs with embedded royalty logic via the MoveRegistry Anchor program. Each skill is packaged in OpenClaw format for agent discovery and composition.

## API

### Skill Discovery

Browse minted skills at:
```
https://moveregistry.lovable.app
```

### Skill Metadata

Each minted skill produces three files hosted in public storage:

| File | Description |
|------|-------------|
| `metadata/<id>.json` | Standard Metaplex NFT metadata |
| `metadata/<id>-skill.json` | OpenClaw `skill.json` with conditions and licensing info |
| `metadata/<id>-SKILL.md` | Human/agent-readable skill description |

### Licensing

Skills can be licensed on-chain via the `license_skill` instruction on the MoveRegistry program (`Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ`). Royalties are distributed automatically through the treasury PDA.

### Payment

Minting uses the x402 micropayment protocol ($0.01 USDC) or direct SOL transfer. Proof-of-payment is embedded on-chain via Memo instructions.

## Conditional Choreography

Skills support a lightweight DSL for conditional triggers:

```
dance:chest_pop if sentiment > 0.8
dance:wave if proximity < 2.0
dance:idle otherwise
```

Variables: `sentiment`, `proximity`, `tempo`, `energy`, `volume`

Downstream agents can compose movements into emergent behaviors based on environmental inputs.

## Integration

To integrate with ClawHub or similar agent registries, fetch individual `skill.json` files from the metadata storage URLs returned during minting.

## Links

- **App**: https://moveregistry.lovable.app
- **Program**: `Dp2JcVDt4seef6LbPCtoHiD5nrHkRUFHJdBPdCUTVeDQ`
- **Network**: Solana Devnet



## Rebrand Hero Section with OpenClaw Context

Move the "Powered by Solana + x402" badge below the title and update all copy to reflect the OpenClaw Dance Skill Registry identity from the README.

### Changes to `src/pages/Index.tsx`

**Hero Section reorder (lines 47-67)**:
1. Remove the "Powered by Solana + x402" badge from above the title
2. Place it below the subtitle instead
3. Update subtitle to: "On-chain dance skill registry -- turning human choreography into verifiable, licensable AI-agent skills"
4. Update secondary text to: "Mint NFT certificates for your dance moves. License them to AI agents, metaverse avatars, and robots."
5. Keep "Built for Colosseum Agent Hackathon by Asura (RyuAsura Dojo)"

**Feature card descriptions (lines 91-110)**:
- Update NFT Certificates: "Mint your choreography as an on-chain Skill NFT. Each certificate stores creator, expression (text DSL or video), and royalty terms."
- Update x402 Verification: "Pay $0.01 via x402 micropayment to verify skill authenticity. Prevents spam and establishes provenance through PayAI facilitator."
- Update Automatic Royalties: "When AI agents, metaverse platforms, or robot manufacturers license your skill, royalties auto-distribute to your treasury on-chain."

**Footer (lines 113-127)**:
- Update text to: "OpenClaw Dance Skill Registry -- Empowering dance creators with on-chain IP protection for AI agents and robots"

### New hero order

```text
MoveRegistry (title)
On-chain dance skill registry... (subtitle)
Mint NFT certificates... (description)
[Powered by Solana + x402 badge]
Built for Colosseum Agent Hackathon...
```

No new files needed. Only `src/pages/Index.tsx` is modified.

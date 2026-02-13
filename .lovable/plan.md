

# Add Q&A and Roadmap Section to the Landing Page

Add two new sections before the footer on the Index page: a **Community Q&A** accordion addressing real hackathon feedback, and a **Roadmap** section showing the MVP-to-future progression.

---

## Q&A Content (sourced from hackathon feedback, with technically accurate answers)

**1. How do you prevent false attribution if someone mints a move they didn't create?**
Currently, World ID proof-of-personhood prevents Sybil attacks (one person, one identity). The creator's wallet is permanently recorded on-chain in the SkillAccount PDA. On our roadmap: community challenge/dispute resolution via DAO governance, and video-hash anchoring so the original recording's content hash is embedded in the NFT metadata, making plagiarism detectable.

**2. How does your system handle latency between a Helius webhook event and a royalty distribution?**
Helius webhooks deliver enhanced transaction data in near real-time (typically under 2 seconds). The webhook writes royalty events to our database immediately. The actual royalty distribution happens atomically on-chain via the `license_skill` instruction and the treasury PDA -- there is no off-chain delay in payment settlement. The webhook simply indexes the event for the dashboard UI.

**3. How are you handling versioning if a choreographer updates a dance move's DSL?**
Each mint is an immutable NFT -- the on-chain SkillAccount and Metaplex metadata are permanent records. To "update" a move, the creator mints a new version with an updated DSL expression. Roadmap: a version-chain field in skill.json linking new versions to their predecessor mint address, so agents can discover the latest version while preserving the full history.

**4. How does your program verify the content hash of submitted choreography?**
The expression field (video IPFS CID or DSL text) is stored directly in the on-chain SkillAccount via the Anchor program. The Metaplex metadata and OpenClaw skill.json both reference this hash. Any verifier can compare the on-chain expression against the original content. Proof-of-payment is also embedded on-chain via Memo instructions (`x402:<tx_hash>`), creating an irrevocable link between payment, verification, and content.

**5. How does the licensing flow work -- one-time purchase or per-use royalties?**
The `license_skill` instruction on the MoveRegistry program supports per-use licensing. Each call transfers USDC from the licensee to the creator's token account via the treasury PDA. An oracle or self-reporting mechanism for off-chain usage tracking is on our roadmap, starting with Helius webhook indexing for on-chain events.

**6. How do you handle disputes -- e.g., a choreographer claims unauthorized use?**
Currently, all licensing transactions are recorded on-chain and indexed via Helius webhooks, providing a full audit trail. On the roadmap: DAO-based arbitration where staked community members can review disputes, and cryptographic attestation (similar to VRF execution proofs) to verify that an agent actually performed the licensed move before royalties are triggered.

**7. How do you solve spam/Sybil and authorship verification?**
World ID (Worldcoin) proof-of-personhood is required before wallet connection or minting. This ensures one human = one verified identity. The x402 micropayment ($0.01 USDC) for verification adds an economic cost to spam. Together, these create a two-layer defense: identity verification + economic friction.

## Roadmap Content

- **Phase 1 (Current MVP)**: NFT skill minting, World ID gate, x402 verification, Memo proofs, OpenClaw skill packages, conditional DSL
- **Phase 2**: DAO governance for disputes and registry curation, version-chaining for skill updates, off-chain usage oracle for per-use royalties
- **Phase 3**: Skill Marketplace for direct buy/sell/license, cross-chain expansion via Wormhole, cryptographic attestation for agent execution proofs
- **Phase 4**: Robot dance competitions with licensed choreography, full ClawHub integration, mainnet launch

---

## Technical Implementation

### Files Modified

**`src/pages/Index.tsx`**
- Import `Accordion, AccordionItem, AccordionTrigger, AccordionContent` from the existing shadcn accordion component
- Import `MessageCircleQuestion, Map` from lucide-react
- Add a "Community Q&A" section using the Accordion component with the 7 Q&A items above, placed between the Tech Stack section and the Footer
- Add a "Roadmap" section below Q&A with 4 phases displayed as a vertical timeline using glass-strong cards with phase labels and bullet points
- Both sections follow the existing animation pattern (`opacity-0 animate-slide-up-fade` with staggered delays)

No new files, no new dependencies -- uses the existing Accordion component and styling patterns already in the project.

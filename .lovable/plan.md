
# Add Forum Links to Q&A Section

Add links to the two Colosseum hackathon forum threads below the Q&A section header text, so visitors can see where the questions originated.

## Changes

**`src/pages/Index.tsx`** (line 200)
- Update the subtitle text under "Community Q&A" to include two linked references to the source forum threads
- Add two small styled links pointing to:
  - `https://colosseum.com/agent-hackathon/forum/6330`
  - `https://colosseum.com/agent-hackathon/forum/5440`
- Style them as subtle pill links (similar to the "Powered by Solana + x402" badge style) with an `ExternalLink` icon, placed below the existing subtitle text

The result will look like:
```
Community Q&A
Technical questions from hackathon reviewers — answered
[Forum Thread #6330 ↗] [Forum Thread #5440 ↗]
```



# Add Example DSL Snippets to Expression Field

Add clickable example buttons below the Expression/Choreography DSL textarea so users can quickly populate the field with valid DSL to test the app.

---

## What You'll See

Below the DSL text area, a row of small clickable example buttons will appear. Clicking one fills the textarea with that example, making it easy to try the app without memorizing the syntax.

---

## Examples to Include

1. **Sentiment Split** -- `dance:chest_pop if sentiment > 0.8` / `dance:wave if sentiment <= 0.8` / `dance:idle otherwise`
2. **Proximity React** -- `dance:wave if proximity < 2.0` / `dance:bow if proximity >= 2.0` / `dance:idle otherwise`
3. **Energy Burst** -- `dance:chest_pop if energy > 0.7` / `dance:sway if energy <= 0.7` / `dance:idle otherwise`
4. **Plain IPFS CID** -- `QmExampleCID1234567890abcdef`

---

## Technical Details

**`src/components/MoveMint.tsx`**
- Define an array of example objects (`label` + `value`) above the component or inside it
- Below the textarea (before the DSL detection messages), render a row of small pill buttons styled with `text-xs glass rounded-full px-2 py-1 cursor-pointer hover:bg-white/10`
- Each button, on click, calls `setVideoHash(example.value)` to populate the textarea
- Label the row with a small "Try an example:" prefix text

No new files or dependencies needed.

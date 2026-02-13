

# Improve Desktop UX for Mint Section

## Problem

On desktop, the verification gates (World ID, ClawKey, Moltbook) display as large, centered cards inside the full-width "Mint Your Move" section, leaving excessive whitespace and making the experience feel sparse. Each gate occupies the entire section with minimal content.

## Changes

### 1. Add a Step Progress Indicator

Show all three gates as a horizontal progress bar at the top of the mint section so desktop users can see where they are in the flow:

```
[1. World ID] ----> [2. ClawKey] ----> [3. Moltbook] ----> [4. Mint]
     (done)           (current)          (locked)          (locked)
```

- Completed steps show a checkmark with a green accent
- Current step is highlighted with the gradient accent
- Future steps are dimmed/locked
- On mobile, this collapses to a compact "Step 2 of 4" indicator

### 2. Two-Column Layout for Gate Cards (desktop only)

On screens >= `lg`, render the active gate card alongside context information:

- **Left column (60%)**: The active verification widget (World ID / ClawKey / Moltbook form)
- **Right column (40%)**: A brief "What's next" summary showing upcoming steps, or helpful context like "Why do we verify?" tips

This eliminates the centered-card-in-a-huge-box problem.

### 3. Compact Gate Card Styling

Reduce padding and vertical spacing on the individual gate cards for desktop:
- Smaller icon (48px -> 40px)
- Tighter spacing between elements
- Left-align text instead of center on desktop (keep centered on mobile)

## Files Modified

### `src/pages/Index.tsx`
- Add a `StepIndicator` component showing the 4-step flow (World ID, ClawKey, Moltbook, Mint)
- Wrap gate content in a `lg:grid lg:grid-cols-5 lg:gap-8` layout
- Active gate card in `lg:col-span-3`, context panel in `lg:col-span-2`
- Add a small "WhatsNext" info panel showing remaining steps

### `src/components/WorldIDVerify.tsx`
- Add `sm:text-left` alignment for desktop
- Reduce icon size and padding on larger screens

### `src/components/ClawKeyRegister.tsx`
- Same left-alignment and compact spacing adjustments

### `src/components/MoltbookConnect.tsx`
- Same left-alignment adjustments (the modal is already good)

### `src/index.css` (if needed)
- Add any utility styles for the step indicator connecting lines

## Step Indicator Detail

```text
Desktop: horizontal bar with icons + labels + connecting lines
Mobile:  "Step 2 of 4 - ClawKey Verification" single line

Steps:
1. Personhood  (World ID)
2. ClawKey     (Agent identity)
3. Moltbook    (Social feed)
4. Mint        (Create your NFT)
```

Each step node shows: icon, label, and status (completed/active/locked). Completed steps have a subtle animated checkmark. The active step pulses gently.


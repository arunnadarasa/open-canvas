# UI Text and Layout Tweaks

## Changes

### 1. Move "Skip for demo" inline with World ID button (`src/components/WorldIDVerify.tsx`)

Move the skip button so it appears right next to the "Verify with World ID" button on the same line, matching the screenshot reference. Wrap both in a flex row with items-center alignment.

### 2. Apply same inline skip pattern to ClawKey and Moltbook

For consistency, also move the "Skip for demo" buttons inline next to the primary action buttons in `ClawKeyRegister.tsx` and in the Moltbook section of `Index.tsx`.
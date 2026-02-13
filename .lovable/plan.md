

# Add Hackathon Demo Bypass Button for World ID Verification

Add a secondary "Skip for demo" button below the World ID verify button, allowing hackathon judges and demo viewers to bypass verification without needing the World ID app.

---

## What You'll See

Below the "Verify with World ID" button, a smaller, subtly styled text button will read "Skip for demo (hackathon judges)". Clicking it immediately marks the user as verified and unlocks the minting form -- no World ID app needed.

---

## Technical Details

**`src/components/WorldIDVerify.tsx`**
- Add a secondary button after the `IDKitWidget` block (around line 89), styled as a subtle ghost/text link:
  - Label: "Skip for demo (hackathon judges)"
  - On click: sets `localStorage.setItem('worldid_verified', 'true')` and calls `onVerified()`
  - Styled with `text-xs text-muted-foreground hover:text-foreground underline cursor-pointer mt-2` to keep it visually secondary
- No changes to the verified badge or existing World ID flow

No new files, dependencies, or migrations needed. Single file edit (~5 lines added).




## Add Refresh Button

Add a "Retry Verification" button in the status area of the MoveMint component. This button will appear when a payment was sent but verification is pending (the warning state shown in the screenshot), allowing the user to re-attempt x402 verification without re-paying.

### Changes

**`src/components/MoveMint.tsx`**:
- Add a "Retry Verification" button inside the status display area, visible when `txSignature` exists but `verifiedContent` is null (i.e., payment sent but not yet verified)
- The button calls `verifyX402Payment(txSignature)` and updates status/verifiedContent on success
- Styled consistently with the existing UI (gradient or outlined button)


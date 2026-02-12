

# Fix: IDL Type Format for Anchor 0.32

## Root Cause

The error `Cannot use 'in' operator to search for 'option' in publicKey` occurs because Anchor 0.32's BorshCoder expects the type name `"pubkey"` for public key fields, but our IDL uses the older format `"publicKey"`.

When the coder encounters `"publicKey"`, it doesn't match any known primitive type (the switch case checks for `"pubkey"`), falls through to the `default` branch, and tries `"option" in "publicKey"` -- which crashes because the `in` operator cannot be used on a string.

## Fix

Update `src/lib/anchor-idl.ts` to replace all occurrences of `"publicKey"` with `"pubkey"` in type definitions. This affects:

1. **`types` array** -- the `SkillAccount` struct fields: `creator`, `mint`, `treasury` (3 fields)
2. **`accounts` array** -- same struct duplicated there (3 fields)
3. **`events` array** -- `SkillMinted` (2 fields), `SkillVerified` (1 field), `SkillLicensed` (2 fields)

## Technical Details

Anchor 0.32 IDL primitive type mapping:
- `"pubkey"` (not `"publicKey"`) -- maps to `borsh.publicKey()`
- `"string"` -- maps to `borsh.str()`
- `"u8"`, `"i64"`, `"u64"`, `"bool"` -- unchanged

### File Changed
- `src/lib/anchor-idl.ts` -- replace all `"publicKey"` type references with `"pubkey"`


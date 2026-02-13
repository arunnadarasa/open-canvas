
# Add Name & Bio Modal Before Moltbook Registration

## Problem

When registering on Moltbook, the agent name is auto-generated as `MR-5HQbjg-c5ke` -- cryptic and unreadable. The user wants a modal (similar to the Moltbook onboarding screenshot) where they can choose a custom agent name and optional bio before registration.

## Changes

### 1. `src/components/MoltbookConnect.tsx`
- Add a Dialog modal that opens when the user clicks "Join Moltbook"
- Modal contains:
  - **Agent Name** text input (required, placeholder: "e.g., KrumpKing, PopLockPro"), with helper text "This becomes your agent's handle on Moltbook"
  - **Short Bio** textarea (optional, max 200 chars, with character counter), placeholder: "A brief description of your dance agent's persona..."
- "Register" button in the modal footer submits the name + description to the edge function
- Basic validation: name required, alphanumeric + hyphens/underscores only, 3-30 chars

### 2. `supabase/functions/moltbook-register/index.ts`
- Accept optional `agent_name` and `description` fields from the request body
- If `agent_name` is provided, use it instead of auto-generating `MR-{wallet}-{suffix}`
- If `description` is provided, use it instead of the default description string
- Fall back to auto-generated values if not provided (backward compatibility)
- Validate name length (3-30 chars) and sanitize input server-side

## Technical Details

### Modal flow
```text
User clicks "Join Moltbook"
  -> Dialog opens with name/bio form
  -> User fills in fields, clicks "Register"
  -> Calls edge function with { wallet_address, agent_name, description }
  -> On success, closes modal, shows claim card as before
```

### Edge function changes (moltbook-register)
```text
// New request body fields:
{ wallet_address, agent_name?, description? }

// Name logic:
const finalName = agent_name?.trim() || `MR-${wallet_address.slice(0,6)}-${suffix}`;

// Description logic:
const finalDesc = description?.trim() || `MoveRegistry dance skill creator (wallet: ${wallet_address.slice(0,8)}...).`;
```

### Input validation
- Client-side: zod schema for name (min 3, max 30, regex for allowed chars) and bio (max 200)
- Server-side: length checks and sanitization before passing to Moltbook API

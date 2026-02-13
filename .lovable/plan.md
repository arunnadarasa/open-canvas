

# Improve Spacing Between Moltbook Card and Devnet Instructions

## Problem

The "Join Moltbook" card and the devnet instructions card are visually touching with no gap between them, making the UI feel cramped on mobile.

## Fix

### `src/pages/Index.tsx` (line ~130-139)

Add a `space-y-4` wrapper around the content inside the fragment so the MoltbookConnect card, devnet instructions card, and MoveMint form all have consistent vertical spacing.

Specifically, wrap the contents of the fragment (`<>...</>`) at lines 129-153 in a `<div className="space-y-4">` so all three blocks (Moltbook card, devnet card, mint form) get uniform 16px gaps between them.

This also means removing the existing `mb-4` from the devnet instructions div (line 139) since `space-y-4` handles the spacing uniformly.


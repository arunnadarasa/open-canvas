
## Fix Build Errors

The app shows a blank page because the build is failing due to two issues:

1. **`@types/buffer` does not exist on npm** -- This package (line 82 in package.json) causes `bun install` to fail entirely with a 404 error, which means NO dependencies get installed -- including Privy and Solana packages.

2. **Missing type declarations** -- Once install succeeds, `@privy-io/react-auth` and `@solana/web3.js` should resolve. If type errors persist, we can add type declaration shims.

### Steps

1. **Remove `@types/buffer` from devDependencies** -- The `buffer` package already includes its own types. This phantom package causes the entire install to fail.

2. **Verify the build succeeds** -- After removing the bad dependency, all other packages (`@privy-io/react-auth`, `@solana/web3.js`, etc.) should install and resolve correctly.

3. **Add environment variables** -- You'll need to set `VITE_PRIVY_APP_ID` with your actual Privy App ID. Since these are public/client-side keys (VITE_ prefix), they can be stored directly in the codebase or set as secrets. I'll need your Privy App ID to configure this.

### Technical Details

- The root cause is `"@types/buffer": "^6.0.3"` in devDependencies -- this package doesn't exist on npm, causing the entire `bun install` to abort
- Removing it fixes the cascading failure where none of the Solana/Privy packages get installed
- No code changes needed beyond the package.json fix

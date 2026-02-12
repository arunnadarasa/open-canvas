

## Polish MoveRegistry with WOW Factor

Transform the current plain, inline-styled page into a visually stunning, animated experience using Tailwind CSS and proper component architecture.

### Visual Redesign

**1. Hero Section (`src/pages/Index.tsx`)**
- Animated gradient background with floating particle/glow effects using CSS keyframes
- Large animated title with a pulsing glow aura behind it
- Animated subtitle with staggered fade-in
- Floating abstract dance silhouette shapes as decorative background elements
- "Powered by Solana + x402" badge with subtle shimmer animation

**2. Feature Cards**
- Glassmorphism cards with backdrop-blur and subtle border glow
- Icon for each feature (lucide-react icons: Award, ShieldCheck, Coins)
- Hover effect: card lifts up, border glows brighter, icon scales
- Staggered entrance animation (fade-in + slide-up with delay)

**3. Mint Section (`src/components/MoveMint.tsx`)**
- Glassmorphism card container with gradient border
- Styled inputs using Tailwind (dark glass background, focus ring with gradient)
- Custom range slider with gradient track
- Payment method toggle as polished pill buttons with smooth transition
- Animated mint button with gradient shimmer sweep on hover
- Pulsing loading state during transaction with animated dots
- Success state: confetti-like burst animation, glowing green checkmark, prominent Solscan link as a styled card

**4. Global Enhancements**
- Replace ALL inline styles with Tailwind classes
- Add custom CSS animations to `src/index.css`: shimmer, float, glow-pulse, gradient-shift
- Animated gradient mesh background that slowly shifts colors
- Smooth scroll behavior
- Footer with subtle separator line and hover effects on links

### New Custom Animations (added to `tailwind.config.ts` and `src/index.css`)

```text
Keyframes:
- shimmer: background-position sweep for button hover
- float: gentle up-down bobbing for decorative elements  
- glow-pulse: opacity pulse for glow effects
- gradient-shift: slow background gradient rotation
- slide-up-fade: entrance animation for staggered elements
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add custom animations, gradient mesh background, glass utilities |
| `tailwind.config.ts` | Add custom keyframes and animation utilities |
| `src/pages/Index.tsx` | Complete redesign with Tailwind, animated hero, glass cards, decorative elements |
| `src/components/MoveMint.tsx` | Replace inline styles with Tailwind, add animations, polish all states |

### Design System

- Primary gradient: `#00dbde` to `#fc00ff` (cyan to magenta)
- Solana accent: `#9945FF` to `#14F195`
- Glass: `bg-white/5 backdrop-blur-xl border border-white/10`
- Dark background: animated gradient mesh using CSS
- Text: white with varying opacity levels
- All rounded corners: `rounded-2xl` for cards, `rounded-xl` for inputs

### Key WOW Moments

1. Page load: Background mesh animates, title fades in with glow, subtitle staggers in
2. Feature cards: Staggered entrance with hover lift + glow
3. Mint form: Inputs glow on focus, payment toggle has smooth pill transition
4. Mint button: Gradient shimmer sweeps across on hover
5. Success: Green glow burst, Solscan link appears with slide-in animation
6. Scroll: Elements animate in as they enter viewport (CSS-only with animation-delay)


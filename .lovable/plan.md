

## Animated Video Hero Section

Replace the current text-only hero with a full-viewport cinematic video hero using the uploaded dance video as a background. The text content animates in on top of the video with a dark overlay for readability.

### Layout

The hero will be a full-screen (100vh) section at the top of the page with the video playing on loop, muted, behind a gradient overlay. All existing hero text stays but gets larger, more dramatic treatment. A scroll-down indicator at the bottom invites users to continue.

### Changes

**1. Copy video to project**
- Copy `user-uploads://Robots_Humans_Avatars_Dance_Together.mp4` to `public/videos/hero-dance.mp4`
- Using `public/` because video elements use direct URL references, not ES6 imports

**2. `src/pages/Index.tsx`** -- Replace hero `<header>` section (lines 51-75)

New hero structure:
- Full-viewport container (`h-screen`) with `position: relative`
- `<video>` element: autoPlay, muted, loop, playsInline, object-cover, absolute fill
- Dark gradient overlay (`bg-gradient-to-b from-black/60 via-black/40 to-background`) for text contrast
- Existing title, subtitle, badge, and credit text centered on top with the same staggered slide-up-fade animations
- Animated scroll indicator (chevron bouncing) at the bottom of the viewport
- The rest of the page content follows naturally below

**3. `src/index.css`** -- Add scroll indicator animation

Add a `bounce-down` keyframe for the scroll chevron:
```css
@keyframes bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
```

**4. `tailwind.config.ts`** -- Register the bounce-down animation

### Visual Design

- Video fills the entire viewport, object-fit cover, no controls
- Gradient overlay transitions from dark at top to the existing `--background` color at bottom for seamless blending
- Text uses the same `gradient-text` styling but with slightly larger sizing
- On mobile, video still plays (playsInline ensures iOS compatibility)
- The rest of the page (mint section, gallery, features, footer) remains unchanged below the hero

### Files to Create/Modify

| File | Action |
|------|--------|
| `public/videos/hero-dance.mp4` | Create -- copy uploaded video |
| `src/pages/Index.tsx` | Modify -- replace hero header with video hero |
| `src/index.css` | Modify -- add bounce-down keyframe |
| `tailwind.config.ts` | Modify -- register bounce-down animation |

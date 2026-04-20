# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A React + TypeScript + Vite landing page for "Claide" (AI content workflow). Single-page app with rich scroll-driven animations, WebGL particle effects, and shadcn/ui components.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server on `localhost:3000` |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | Run ESLint across the project |
| `npm run preview` | Preview the production build locally |

No test runner is configured.

## Build & Dev Notes

- **Vite** is configured with `base: './'` and `@/` aliased to `./src`. Dev server runs on port 3000.
- **TypeScript** uses `verbatimModuleSyntax: true` — type-only imports must use the `type` keyword.
- **Strict TS flags enabled**: `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`. Unused variables will fail the build.
- Static assets (images) are referenced with relative paths like `./images/dashboard.jpg` and served from `public/`.

## Architecture

### Page Structure

`src/App.tsx` has a single React Router route (`/`), rendered inside `BrowserRouter` in `src/main.tsx`. The `Home` page (`src/pages/Home.tsx`) is a vertical composition of section components:

```
Home
├── Navigation (fixed, blur-on-scroll)
├── Hero (WebGL particle background + staggered entrance)
├── Capabilities (scroll-highlight text + 3 feature cards)
├── Architecture (text + image layout with floating glass overlay)
├── Integrations (4-card grid of AI model integrations)
└── Footer (CTA + links)
```

### Animation System

Three libraries work together:

1. **Lenis** (`src/hooks/useSmoothScroll.ts`) — smooth scroll with `lerp: 0.08`. It is wired into GSAP's ticker and calls `ScrollTrigger.update` on every scroll event. The hook returns a ref to the Lenis instance.
2. **GSAP + ScrollTrigger** — every section uses `useGSAP` with `{ scope: ref }` and registers `ScrollTrigger` at the top of the file. Entrance animations are scroll-triggered (`start: 'top 80%'` or similar). The `Hero` uses a GSAP timeline with `delay` instead of ScrollTrigger.
3. **React Three Fiber** (`src/components/ParticleSwarm.tsx`) — a full-screen WebGL canvas with 8000 particles using custom GLSL vertex/fragment shaders. Mouse position is tracked via a module-level mutable object (`mouseState`) rather than React state to avoid re-renders, and lerped inside `useFrame`.

### Styling Conventions

- **Tailwind CSS v3** with shadcn/ui theme tokens (CSS variables in `src/index.css`).
- **Custom glassmorphism** via `.liquid-glass` and `.liquid-glass-hover` utility classes (backdrop blur + semi-transparent borders). These are used for cards, buttons, and overlays throughout.
- **Color palette**: `#030305` (primary bg), `#0A0A0C` (secondary bg), `#EAEAEA` (text), `#7A7A7A` (muted text), `#7B61FF` (purple accent), `#FF8C42` (orange accent).
- **Typography**: `Inter Tight` from Google Fonts. Labels use `.font-mono-label` (Geist Mono fallback).
- **Global styles**: `html.lenis` and scroll-behavior overrides are in `src/index.css` for Lenis compatibility.

### Component Patterns

- **shadcn/ui components** live in `src/components/ui/` and are Radix-based. Import them as `import { Button } from '@/components/ui/button'`.
- **Reusable animation component**: `ScrollHighlightText` splits text into words and animates each word's color from muted to white via ScrollTrigger scrub.
- **Section components** (`src/sections/`) each manage their own refs and GSAP animations independently.

## Important Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Build config, `@/` alias, port 3000, `kimi-plugin-inspect-react` plugin |
| `tailwind.config.js` | Theme colors mapped to CSS variables, `tailwindcss-animate` plugin |
| `components.json` | shadcn/ui config (style: new-york, baseColor: slate) |
| `src/index.css` | Tailwind directives, CSS variables, `.liquid-glass`, Lenis overrides |
| `tsconfig.app.json` | Strict TypeScript settings, `verbatimModuleSyntax`, path mapping |

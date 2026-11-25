---
name: wahaj-store
description: >-
  Wahaj Store ("Warm Limestone & Soy Atelier") design system derived from the
  Wahaj landing page. Use whenever designing, styling, refactoring, or reviewing
  any page or component across Wahaj Store (/products, /products/[slug], /cart,
  /checkout, /orders, /wishlist, /account, /auth/*, or /admin/*) so every route
  shares exact palette tokens, Thmanyah Extended Arabic/English typography rules,
  surface cadence, pill CTAs, card geometry, and restrained motion.
---

# Wahaj Store Design System

Apply the editorial landing-page aesthetic consistently across every inner page and component instead of legacy slate/teal rectangular defaults (`rounded-md`, `wahaj-teal`). Read [Tokens & Component Recipes](./references/tokens-and-components.md) for copy-pasteable Tailwind classes and file locations.

## Aesthetic Direction

**Warm Limestone & Soy Atelier**: Calm editorial luxury blending poured limestone (`#F7F4EE`), toasted beeswax/sand (`#EBE4D8`), botanical sage (`#E7ECE5`), charred wood (`#161412`), and terracotta flame (`#B85A2D`). Let generous whitespace, crisp Arabic calligraphy (`Thmanyah`), and tactile photography breathe without clutter or cold grays.

## Core Design Rules

1. **Unify Surfaces & Palette**
   - Default page ground: `#F7F4EE` (cream), alternating with `#FAF8F5` (warm porcelain) and `#FFFFFF` (cards/inputs) divided by hairline `1px` warm borders (`#E8E2D8` or `#EDE8E0`).
   - Primary CTA fill: `#B85A2D` (`hover:bg-[#9E4A22]`) with `shadow-pill`. Use `#1C1917` charcoal pills (`hover:bg-[#B85A2D]`) for secondary high-contrast CTAs and active filter states.
   - Reserve cold/bright system colors strictly for status badges; never use `#187d6d` (`wahaj-teal`) or cool `gray-*` / `slate-*` on storefront surfaces or focus rings (use `focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20`).

2. **Bilingual Arabic-First Typography (`globals.css`)**
   - Display headings (`h1`, `h2`, `.font-editorial`): Arabic uses `Thmanyah Serif Display` with `"swsh" 1, "calt" 1, "dlig" 1` (`font-weight: 900` on `h1`/`h2`, `700` on `h3`); English uses `Cormorant Garamond`.
   - Body & UI copy (`body`, metadata, controls): `Thmanyah Sans` (`line-height: 1.85` in Arabic) / `Inter` in English.
   - **Never put `<h3>` on small UI labels or footer headings**: `globals.css` styles `html[lang="ar"] h3` with the large editorial serif display face (`swsh` swashes). Use `<span>` or `<p>` for small sans headings (`text-xs sm:text-sm font-semibold`).
   - **Never add letter-spacing (`tracking-*`), `uppercase`, or `italic` to Arabic text**: `globals.css` zeroes tracking and strips italics for Arabic, and components must guard uppercase styling with `isArabic ? "" : "uppercase tracking-[0.2em]"`.

3. **Shapes, Borders & Spacing**
   - **Buttons & Filter Pills**: Always `rounded-full` (`px-6 py-3` or `px-8 py-4`) with subtle `active:scale-[0.98]`.
   - **Media Cards, Accordions & Inputs**: Cards use `rounded-2xl` (or `rounded-3xl` for concierge/highlight callouts); inputs use `rounded-full` (search/newsletter) or `rounded-xl` (multi-line / checkout fields) with warm borders (`#DED7CB` / `#E5DDD0`) and clean white `#FFFFFF` surface.
   - **Navbars**: Floating translucent glass (`rounded-[32px] bg-[#F7F4EE]/75 backdrop-blur-xl`) when scrolled (`y > 28px`), full-bleed seam at top, logo-only mark without side wordmark.
   - **RTL-Safe Spatial Properties**: Use logical Tailwind utilities (`ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`) and flip directional arrow icons when `isArabic` (`className={isArabic ? "rotate-180" : ""}`).

4. **Restrained Motion**
   - Primary easing curve everywhere: `cubic-bezier(0.22, 1, 0.36, 1)`.
   - Use `useInViewOnce`, `useScrollVars` (CSS custom-property updates inside `requestAnimationFrame`), and `CountUpNumber` from `@/components/storefront/scroll-animations`.
   - Every transition/animation must honor `@media (prefers-reduced-motion: reduce)` (`usePrefersReducedMotion()`).

5. **Applying to Inner Pages**
   - When touching `/products`, `/products/[slug]`, `/cart`, `/checkout`, `/orders`, `/wishlist`, `/account`, or `/auth/*`, wrap `<main>` on `bg-[#F7F4EE]` with `<StorefrontHeader />` and `<StorefrontFooter />`, upgrade legacy `Button` / `Card` / `Input` usage to warm borders (`#E8E2D8`), `rounded-2xl` cards, `#1C1917` / `#B85A2D` pills, and `.font-editorial` headings.
   - After styling any page, run `npx tsc --noEmit`, `npx eslint <changed-files>`, and `npm run test` to confirm zero regressions.

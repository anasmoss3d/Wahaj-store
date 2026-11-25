# Wahaj Store Design Tokens & Component Recipes

Reference values verified against `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, and the storefront landing sections.

## 1. Color Palette

| Role | Hex / Tailwind Token | Usage |
| :--- | :--- | :--- |
| **Canvas (Base Cream)** | `#F7F4EE` (`bg-wahaj-cream`) | Body ground, Hero, Navbar static backdrop |
| **Porcelain Surface** | `#FAF8F5` | Collection Browser, FAQ band |
| **Pure Light Band** | `#FFFFFF` | Scent Moments section, open FAQ cards, Inputs |
| **Warm Linen / Kicker** | `#F4EFEB` (`bg-wahaj-linen`) | Secondary Hero button pill, Hero kicker pill |
| **Sand / Editorial Plinth** | `#EBE4D8` / `#EDE7DD` (`bg-wahaj-sand`) | Scent Archive band, product photo mounts |
| **Sage Band** | `#E7ECE5` | Curated Scents band (`border-[#D5DCD3]`, mount `#DCE2DA`) |
| **Celadon Highlight** | `#D7DDD4` | Newsletter rounded banner (`rounded-[32px] sm:rounded-[40px]`) |
| **Espresso Dark Chapter** | `#161412` (`bg-wahaj-espresso`) | Craftsmanship band (`border-[#2A2622]`, inner circles `#221F1C`) |
| **Obsidian Dusk Footer** | `#12130e` | Footer sky dissolving into `/brand/footer-horizon.webp` |
| **Warm Stone Hairline** | `#E8E2D8` / `#EDE8E0` | Section dividers & card borders |
| **Ink Primary** | `#1C1917` (`text-wahaj-charcoal`) | Headings, active category pill, dark pill buttons |
| **Muted Body** | `#665E57` / `#57534E` / `#78716C` | Paragraphs, descriptions, scent notes, subtle metadata |
| **Muted Muted Caption** | `#8C827A` / `#A89F91` (on dark) | Stats captions, dark-section descriptions |
| **Terracotta Primary CTA** | `#B85A2D` (`bg-wahaj-terracotta`) | Primary buttons, hovers, price/metric accent highlights |
| **Terracotta Hover** | `#9E4A22` (`wahaj-terracottaDark`) | Hover state on primary buttons & Scent Archive titles |
| **Warm Bronze (On Dark)** | `#C4956A` / `#E5A776` | Dark-section kickers, divider hairlines, WhatsApp glyph |

## 2. Typography Stack (`layout.tsx` & `globals.css`)

- **Editorial Serif Display (`font-editorial`)**:
  - Arabic: `Thmanyah Serif Display` (`var(--font-thmanyah-serif)`), `font-feature-settings: "swsh" 1, "calt" 1, "dlig" 1`, `line-height: 1.28 !important`, `letter-spacing: 0 !important`.
  - Weights: `font-black` (`900`) on `h1` and `h2`; `font-bold` (`700`) on `h3` and card product names.
  - English fallback: `Cormorant Garamond` (`var(--font-serif)`).
- **UI Sans (`body` / `font-sans`)**:
  - Arabic: `Thmanyah Sans` (`var(--font-thmanyah-sans)`), `line-height: 1.85`, weights `400`, `500`, `700`, `900`.
  - English: `Inter` (`var(--font-latin)`).

### Guardrails for Arabic Text
- Always conditionally gate uppercase tracking badges:
  ```tsx
  <span className={isArabic ? "" : "uppercase tracking-[0.2em]"}>{label}</span>
  ```
- Use `<span>` or `<p>` (never `<h3>`) for compact card labels, footer column headings, or form group titles when clean sans readability is wanted instead of swashed display calligraphy.

## 3. Component Recipes

### Section Container Band
```tsx
<section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-12 bg-[#FAF8F5] border-b border-[#E8E2D8]">
  <div className="mx-auto max-w-7xl">...</div>
</section>
```

### Section Header (Kicker + Display Headline + Lead)
```tsx
<div className="mb-10 sm:mb-12">
  <p className={`text-[11px] font-medium text-[#8C7A6B] mb-2 ${isArabic ? "" : "uppercase tracking-[0.2em]"}`}>
    {kicker}
  </p>
  <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-black text-[#1C1917] tracking-tight">
    {title}
  </h2>
  <p className="mt-3 max-w-xl text-xs sm:text-sm text-[#78716C] leading-relaxed font-light">
    {subtitle}
  </p>
</div>
```

### Pill Buttons & Action Controls
```tsx
// Primary Terracotta CTA
"inline-flex items-center justify-center gap-2.5 rounded-full bg-[#B85A2D] px-7 py-3.5 text-sm font-medium text-white shadow-pill transition-all duration-300 hover:bg-[#9E4A22] active:scale-[0.98]"

// High-Contrast Charcoal Secondary CTA (shifts to Terracotta on hover)
"inline-flex items-center justify-center gap-2.5 rounded-full bg-[#1C1917] px-7 py-3 text-xs sm:text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#B85A2D] active:scale-[0.98]"

// Soft Cream / White Outline Pill
"inline-flex items-center justify-center gap-2 rounded-full border border-[#D8CFC2] bg-white px-6 py-3 text-xs sm:text-sm font-medium text-[#1C1917] shadow-sm transition-all duration-300 hover:border-[#B85A2D] hover:text-[#B85A2D] active:scale-[0.98]"
```

### Product Photo Card (Editorial Mount + Hover Zoom)
```tsx
<Link href={`/products/${slug}`} className="group block">
  <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl bg-[#EDE7DD] shadow-sm transition-all duration-500 group-hover:shadow-md">
    <Image
      alt={title}
      src={imageSrc}
      fill
      className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
    />
  </div>
  <div className="mt-4 flex items-baseline justify-between gap-3">
    <span className="font-editorial text-lg sm:text-xl font-bold text-[#1C1917] group-hover:text-[#B85A2D] transition-colors truncate">
      {title}
    </span>
    <span className="shrink-0 text-xs sm:text-sm text-[#78716C] font-light">
      {priceFormatted}
    </span>
  </div>
</Link>
```

### Surface Card & Form Field Upgrades (Inner Pages & Checkout)
```tsx
// Editorial Card Shell
"rounded-2xl border border-[#E5DDD0] bg-white p-5 sm:p-7 shadow-[0_16px_38px_-18px_rgba(28,25,23,0.08)]"

// Cream Tinted Callout / Concierge Box
"rounded-3xl border border-[#E5DDD0] bg-[#F2ECE4]/75 p-6 shadow-sm"

// Editorial Form Input (replaces legacy rounded-md border-concrete-200 focus:wahaj-teal)
"min-h-11 w-full rounded-xl border border-[#DED7CB] bg-white px-4 text-sm text-[#1C1917] placeholder:text-[#A8A29E] outline-none transition-all focus:border-[#B85A2D] focus:ring-2 focus:ring-[#B85A2D]/20"
```

## 4. Reference Storefront Files
- Navbar & Chrome: `src/components/storefront/navbar-shell.tsx`, `src/components/storefront/footer.tsx`
- Motion Primitives: `src/components/storefront/scroll-animations.tsx`, `src/components/storefront/smooth-scroll.tsx`
- Landing Sections (top to bottom):
  1. `hero-section.tsx` (`#F7F4EE`)
  2. `scent-moments-showcase.tsx` (`#FFFFFF`)
  3. `craft-arched.tsx` (`#161412`)
  4. `curated-scents-showcase.tsx` (`#E7ECE5`)
  5. `collection-browser.tsx` (`#FAF8F5`)
  6. `scent-archive.tsx` (`#EBE4D8`)
  7. `care-ritual-light.tsx`
  8. `faq-section.tsx` (`#FAF8F5`)
  9. `newsletter-glow.tsx` (`#F7F4EE` + `#D7DDD4` card)
  10. `footer.tsx` (`#12130e`)

# CLAUDE.md — Cartographer's Palette

Project decisions and conventions for this session.

## Project overview

A procedural fantasy map generator that runs entirely in the browser using the Canvas 2D API.
No build step. No framework. No generative art library. Deployed as static HTML to Netlify.

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Rendering | Canvas 2D API | Noise fields map to pixel buffers; PNG export is native; raster blur is simpler than SVG path conversion |
| JS modules | Native ES modules | No bundler needed for a single-page app of this scope |
| CSS architecture | Four files (reset → tokens → layout → components) | Cascade order; tokens must be available before layout rules |
| Fonts | Google Fonts (IM Fell English, Lora, Courier Prime) | Vintage cartographic character; all loaded with `font-display: swap` |
| Noise | Custom Simplex noise (noise.js) | Adapted from Stefan Gustavson (public domain); seeded via shuffled permutation table |
| PRNG | mulberry32 (prng.js) | Fast, well-distributed 32-bit PRNG; seed string → int via FNV-1a |

## Aesthetic decisions

- **Palette**: Aged parchment base (`#f2e3b6`) with ink tones (`#1e110a`, `#6b4332`, `#b8936a`), cartographer's red (`#b8391a`), and gold accent (`#c4882a`). Deliberately departs from the portfolio's clean modern palette to signal design range.
- **Page background**: Dark desk colour (`#1c0f08`) so the parchment content area appears to float on the workbench.
- **Icons**: Custom inline SVG — no external library — to maintain cartographic character and eliminate a network dependency.

## File structure

```
index.html          Single entry point
css/
  reset.css         Modern CSS reset (vendor-prefix rules suppressed via stylelint-disable)
  tokens.css        CSS custom properties for all design tokens
  layout.css        Page structure, responsive grid, section layouts
  components.css    UI components (buttons, seed input, legend, skip link)
js/
  main.js           Entry point; event wiring; calls into terrain + renderer
  noise.js          Simplex noise + FBM; createNoise(rng) returns a seeded noise fn
  prng.js           mulberry32(seed) PRNG and fnv1a(str) hash
  terrain.js        generateTerrain(seedHex) → { grid, width, height }
  renderer.js       Canvas setup, renderPlaceholder, renderMap, PNG export canvas
  seed.js           URL hash sync, seed parse/validate, random seed generation
assets/
  favicon.svg       Compass rose favicon
```

## CSS conventions

- Properties alphabetised within each rule (enforced by `stylelint-order`).
- Logical properties throughout: `margin-block`, `margin-inline`, `padding-block`, `padding-inline`, `inset-block-start`, etc. This is a code convention — there is no Stylelint plugin enforcing it (no logical-properties plugin in deps).
- Physical directional properties (`top`, `left`, etc.) avoided by convention; not tooling-banned.
- `--space-*` tokens follow an 8-point scale.
- Media queries use CSS Level 4 range notation: `@media (width >= 900px)` not `@media (min-width: 900px)`.
- Reset vendor prefixes are suppressed with `/* stylelint-disable property-no-vendor-prefix */`.
- `[hidden] { display: none !important }` is in reset.css (with stylelint-disable comment) to ensure the UA-stylesheet rule isn't overridden by component `display` values (e.g. `display: flex` on `.map-state`).
- Selector naming follows BEM (enforced by `selector-class-pattern` in Stylelint).

## JS conventions

- ES modules, `type="module"` on the script tag.
- No `console.log` (ESLint: `no-console: error`).
- Strict equality (`===`) only (ESLint: `eqeqeq: always`).
- No unused variables (ESLint: `no-unused-vars: error`).
- Script tag has `defer`; `DOMContentLoaded` listener in main.js handles init sequencing.
- Canvas font rendering waits on `document.fonts.ready` before first paint.

## Canvas sizing

- CSS display: `aspect-ratio: 16 / 11`, `inline-size: 100%` (no max — fills the grid column).
- HTML attributes: `width="800" height="550"` (prevent CLS).
- JS sets `canvas.width = CANVAS_W * dpr` for HiDPI sharpness.
- Internal rendering resolution: 800×550.
- Terrain grid resolution: 800×550 (1:1 with canvas — no upscaling blur).

## Seed system

- 8-character hex string (e.g. `a3f7b2c1`).
- Encoded in URL hash as `#seed=a3f7b2c1`. `setSeedInURL(seed, push?)` uses `replaceState` by default; generate button and Enter key pass `push=true` so back/forward navigation works between generated maps.
- `parseSeed(raw)` strips non-hex chars and pads/truncates to 8 chars.
- `isValidSeed(str)` tests `/^[0-9a-f]{8}$/i`.
- Inline `<p id="seed-error">` shows/hides via `updateSeedValidity()` in main.js; also clears after every generate so a stale error doesn't persist.

## Netlify

- `netlify.toml` includes security headers on `/*` and long-lived cache on `/css/*`, `/js/*`, `/assets/*`.
- HTML files served with `max-age=0, must-revalidate` (Netlify invalidates on deploy, but CSS/JS have no content hashing).
- `_redirects` is intentionally minimal — hash routing requires no server-side redirect rules.

## Pre-commit tooling

Husky + lint-staged wired and verified. Configs:

| File | Tool | Enforces |
|---|---|---|
| `eslint.config.js` | ESLint 9 (flat config) | `no-console`, `no-unused-vars`, `eqeqeq` |
| `.stylelintrc.json` | Stylelint | Alphabetical properties, BEM selectors, standard config |
| `.prettierrc` | Prettier | LF, 100-char width, single quotes, trailing commas |
| `.editorconfig` | EditorConfig | LF, trailing newline, no trailing whitespace |
| `.gitattributes` | Git | `* text=auto eol=lf` — overrides Windows `autocrlf` |

- `package.json` has `"type": "module"` (required for ESLint 9 flat config to parse as ESM without warning).
- `rule-empty-line-before` is disabled in Stylelint — Prettier owns blank-line formatting.
- Logical properties are a code convention only; no Stylelint plugin installed for them.

## Lighthouse targets

| Category | Target |
|---|---|
| Performance | ≥ 90 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |
| SEO | ≥ 90 |

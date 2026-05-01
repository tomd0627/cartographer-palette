# Cartographer's Palette

A procedural fantasy map generator that runs entirely in the browser. Each generation produces a unique island with organic coastlines, distinct terrain regions, and cartographic detail — driven by a shareable seed value.

Built as a portfolio piece demonstrating generative algorithms, Canvas 2D mastery, and considered visual design — with zero runtime dependencies.

---

## Features

- **Procedural generation** — every map is unique, produced by a seeded noise algorithm written from scratch
- **Shareable seeds** — an 8-character hex seed fully reproduces any map; seeds are stored in the URL hash
- **PNG export** — download the current map at 2× resolution
- **Seven terrain types** — deep ocean, shallow water, coastline, lowland, highland, mountain, snow peaks
- **Organic coastlines** — produced by a box-blur pass over the terrain pixel buffer, not vector path hacks
- **Cartographic aesthetic** — parchment palette, compass rose, decorative border — rendered entirely with the Canvas API

---

## Running locally

No build step required. Any static HTTP server works:

```bash
# Python (built-in)
python -m http.server 8080

# Node.js
npx serve .

# VS Code Live Server extension — open index.html, click "Go Live"
```

Then open `http://localhost:8080` in your browser.

> Opening `index.html` directly via `file://` will fail because ES modules require an HTTP origin. Use a local server.

---

## Deployment

Deployed to Netlify. Push to the connected branch; Netlify picks up `netlify.toml` automatically.

The `netlify.toml` configures:

- Long-lived cache headers (`max-age=31536000, immutable`) for `/css/*`, `/js/*`, `/assets/*`
- `must-revalidate` for HTML
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`

---

## Development tooling

Install devDependencies (Node.js required):

```bash
npm install
```

This also installs the Husky pre-commit hook. The hook runs lint-staged on every commit:

| Files    | Checks                                                                            |
| -------- | --------------------------------------------------------------------------------- |
| `*.js`   | ESLint (no-console, no-unused-vars, eqeqeq) → Prettier                            |
| `*.css`  | Stylelint (alphabetical order, logical properties, no vendor prefixes) → Prettier |
| `*.html` | Prettier                                                                          |

---

## Generation algorithm

### Overview

Every map is the deterministic output of five sequential stages applied to a single 32-bit seed integer. The same seed produces the same map on any device or browser.

### Stage 1 — Seeded PRNG

The 8-character hex seed string is hashed to a 32-bit unsigned integer using **FNV-1a** (Fowler–Noll–Vo), a non-cryptographic hash chosen for its avalanche property — small changes to the seed string produce very different integers. The integer seeds a **Mulberry32** PRNG, a fast, high-quality 32-bit generator that outputs uniform floats in `[0, 1)`. All subsequent randomness flows through this single stream.

### Stage 2 — Height field via Fractional Brownian Motion

An 800×550 grid of height values is produced by sampling **Simplex noise** at six octaves. This technique — called **Fractional Brownian Motion (FBM)** — layers noise passes at doubling frequencies with halving amplitudes:

| Octave | Contribution | Detail                            |
| ------ | ------------ | --------------------------------- |
| 1      | 50%          | Continental shape, large plateaus |
| 2      | 25%          | Regional variation, broad ridges  |
| 3      | 12.5%        | Hills and valleys                 |
| 4      | 6.25%        | Terrain roughness                 |
| 5      | 3.125%       | Fine surface texture              |
| 6      | 1.5625%      | Micro-detail                      |

The Simplex noise implementation uses a **seeded permutation table** — the PRNG performs a Fisher-Yates shuffle of integers 0–255, which determines the noise's spatial character. Each noise call's frequency and phase offset varies by seed, so the continental shapes differ between seeds at the macro level, not just in detail.

### Stage 3 — Island mask

Raw FBM noise repeats at all scales and has no natural boundary. To create a convincing surrounded-by-ocean island, a **radial falloff mask** is applied:

1. Compute the normalised distance of each grid point from the centre.
2. Apply a **smoothstep** curve (cubic Hermite) over the range `[maskRadius, 0.95]` — values inside are preserved, outside are forced to zero.
3. **Perturb the mask boundary** by adding a second, low-frequency noise sample scaled by 0.28. This ensures the coastline is never a perfect ellipse.

The `maskRadius` parameter (0.42–0.54) is seeded by the PRNG, so different seeds produce different island widths.

### Stage 4 — Terrain classification

Each height value `v ∈ [0, 1]` is mapped to a terrain tier:

| Range     | Tier          | Hex colour |
| --------- | ------------- | ---------- |
| < 0.10    | Deep ocean    | `#1d3d5c`  |
| 0.10–0.30 | Shallow ocean | `#2e6288`  |
| 0.30–0.42 | Coastline     | `#c9b87a`  |
| 0.42–0.62 | Lowland       | `#7a9e55`  |
| 0.62–0.78 | Highland      | `#8b6e3a`  |
| 0.78–0.91 | Mountain      | `#b0a090`  |
| ≥ 0.91    | Snow peaks    | `#e8dfd0`  |

A subtle brightness shift `(1 + (v − 0.5) × 0.15)` is applied within each tier to add dimensionality — mountains lighten as they rise toward snow, ocean deepens toward the centre.

### Stage 5 — Rendering pipeline

1. **Pixel buffer** — terrain RGB values are written directly to a `Uint8ClampedArray` (one byte per channel), the most efficient path to the canvas.
2. **Box blur** — a 3×3 averaging kernel runs once over the buffer. This softens terrain boundaries to produce organic-looking coastlines without any path tracing or vector operations.
3. **OffscreenCanvas compositing** — the blurred buffer is drawn to an `OffscreenCanvas` at the 800×550 grid resolution, then composited onto the canvas via `drawImage`.
4. **Vignette** — a radial gradient dims the map's edges to give depth and draw the eye toward the centre.
5. **Cartographic overlay** — a double-rule border, compass rose, and parchment highlight are drawn directly using `ctx.beginPath / arc / fillRect` calls. No image assets.

Total generation time: < 100 ms on a mid-range device at the standard 800×550 grid.

---

## Browser support

Last 2 major versions of Chrome, Firefox, Safari, Edge. Requires:

- ES modules (`type="module"`)
- `OffscreenCanvas`
- `navigator.clipboard` (graceful fallback: text selection)
- CSS `aspect-ratio`, logical properties, `clamp()`

---

## Licence

MIT — see [LICENSE](LICENSE).

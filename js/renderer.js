import { TERRAIN } from './terrain.js';

export const CANVAS_W = 800;
export const CANVAS_H = 550;

// ── Canvas setup ──────────────────────────────────────

/**
 * Sizes the canvas for the current device pixel ratio and returns the 2D context.
 * Should be called once on init and again on resize.
 */
export function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_W * dpr;
  canvas.height = CANVAS_H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}

// ── Placeholder render (shown before first Generate) ──

export function renderPlaceholder(ctx) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawParchment(ctx, CANVAS_W, CANVAS_H);
  drawBorder(ctx, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.font = `italic ${18}px 'IM Fell English', 'Palatino Linotype', serif`;
  ctx.fillStyle = 'rgba(107, 67, 50, 0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Generate a map to begin your journey', CANVAS_W / 2, CANVAS_H / 2);
  ctx.restore();
}

// ── Full map render ───────────────────────────────────

/**
 * Renders a complete map from terrain data.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ grid: Float32Array, width: number, height: number }} terrain
 */
export function renderMap(ctx, terrain) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  drawParchment(ctx, CANVAS_W, CANVAS_H);

  const { grid, width: gw, height: gh } = terrain;

  // Step 1: build terrain ImageData at grid resolution
  const raw = buildTerrainImageData(grid, gw, gh);

  // Step 2: blur for organic coastlines
  const blurred = boxBlur(raw, gw, gh, 1);

  // Step 3: draw terrain to canvas (scaled up)
  drawImageDataScaled(ctx, blurred, gw, gh, CANVAS_W, CANVAS_H);

  // Step 4: overlay effects
  drawVignette(ctx, CANVAS_W, CANVAS_H);
  drawBorder(ctx, CANVAS_W, CANVAS_H);
  drawCompassRose(ctx, CANVAS_W, CANVAS_H);
}

// ── Image data builders ───────────────────────────────

function buildTerrainImageData(grid, w, h) {
  const data = new Uint8ClampedArray(w * h * 4);

  for (let i = 0; i < grid.length; i++) {
    const v = grid[i];
    const { rgb } = classifyTerrain(v);
    const idx = i * 4;

    // Subtle height-based shading within each terrain band
    const shade = 1 + (v - 0.5) * 0.15;
    data[idx] = Math.min(255, rgb[0] * shade);
    data[idx + 1] = Math.min(255, rgb[1] * shade);
    data[idx + 2] = Math.min(255, rgb[2] * shade);
    data[idx + 3] = 255;
  }

  return data;
}

function classifyTerrain(v) {
  for (const tier of TERRAIN) {
    if (v < tier.threshold) return tier;
  }
  return TERRAIN[TERRAIN.length - 1];
}

// ── Box blur (3×3, n passes) ──────────────────────────

function boxBlur(data, w, h, passes) {
  let src = data;
  for (let p = 0; p < passes; p++) {
    src = blurPass(src, w, h);
  }
  return src;
}

function blurPass(src, w, h) {
  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        b = 0,
        count = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(w - 1, x + dx));
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          const idx = (ny * w + nx) * 4;
          r += src[idx];
          g += src[idx + 1];
          b += src[idx + 2];
          count++;
        }
      }

      const out = (y * w + x) * 4;
      dst[out] = r / count;
      dst[out + 1] = g / count;
      dst[out + 2] = b / count;
      dst[out + 3] = 255;
    }
  }

  return dst;
}

// ── Scale ImageData onto canvas ───────────────────────

function drawImageDataScaled(ctx, data, srcW, srcH, dstW, dstH) {
  const offscreen = new OffscreenCanvas(srcW, srcH);
  const offCtx = offscreen.getContext('2d');
  offCtx.putImageData(new ImageData(data, srcW, srcH), 0, 0);

  // Scale with slight smoothing for the raster-to-canvas step
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(offscreen, 0, 0, dstW, dstH);
  ctx.restore();
}

// ── Decorative elements ───────────────────────────────

function drawParchment(ctx, w, h) {
  ctx.fillStyle = '#f2e3b6';
  ctx.fillRect(0, 0, w, h);

  // Subtle parchment grain using overlapping noise-like gradients
  const grad = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.5, h * 0.5, w * 0.7);
  grad.addColorStop(0, 'rgba(255, 245, 210, 0.4)');
  grad.addColorStop(1, 'rgba(180, 140, 80, 0.15)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawVignette(ctx, w, h) {
  const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.85);
  vignette.addColorStop(0, 'rgba(30, 17, 10, 0)');
  vignette.addColorStop(1, 'rgba(30, 17, 10, 0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawBorder(ctx, w, h) {
  const margin = 10;
  const inner = 5;

  ctx.save();
  ctx.strokeStyle = '#4a2c1a';
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, margin, w - margin * 2, h - margin * 2);

  ctx.strokeStyle = '#b8936a';
  ctx.lineWidth = 0.75;
  ctx.strokeRect(
    margin + inner,
    margin + inner,
    w - (margin + inner) * 2,
    h - (margin + inner) * 2,
  );
  ctx.restore();
}

function drawCompassRose(ctx, w, h) {
  const cx = w - 58;
  const cy = h - 58;
  const size = 28;

  ctx.save();
  ctx.translate(cx, cy);

  // N arrow (red)
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size * 0.22, 0);
  ctx.lineTo(size * 0.22, 0);
  ctx.closePath();
  ctx.fillStyle = '#b8391a';
  ctx.fill();

  // S/E/W arrows
  for (const angle of [180, 90, 270]) {
    ctx.save();
    ctx.rotate((angle * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(-size * 0.18, 0);
    ctx.lineTo(size * 0.18, 0);
    ctx.closePath();
    ctx.fillStyle = '#4a2c1a';
    ctx.fill();
    ctx.restore();
  }

  // Centre dot
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#1e110a';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#f2e3b6';
  ctx.fill();

  // N label
  ctx.font = `bold ${10}px 'Courier Prime', monospace`;
  ctx.fillStyle = '#1e110a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('N', 0, -size - 4);

  ctx.restore();
}

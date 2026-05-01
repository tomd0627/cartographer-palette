import { setupCanvas, renderPlaceholder, renderMap, CANVAS_W, CANVAS_H } from './renderer.js';
import {
  generateRandomSeed,
  parseSeed,
  isValidSeed,
  getSeedFromURL,
  setSeedInURL,
} from './seed.js';
import { generateTerrain } from './terrain.js';

let currentSeed = '';
let canvas;
let ctx;
let isGenerating = false;

// ── Initialisation ────────────────────────────────────

async function init() {
  await document.fonts.ready;

  canvas = document.getElementById('map-canvas');
  ctx = setupCanvas(canvas);

  const seedInput = document.getElementById('seed-input');
  const seedError = document.getElementById('seed-error');
  const btnGenerate = document.getElementById('btn-generate');
  const btnCopy = document.getElementById('btn-copy-seed');
  const btnExport = document.getElementById('btn-export');

  function updateSeedValidity(val) {
    const invalid = val.length > 0 && !isValidSeed(val);
    seedInput.setCustomValidity(invalid ? 'Enter a valid 8-character hex seed (0–9, a–f).' : '');
    seedError.hidden = !invalid;
  }

  currentSeed = getSeedFromURL() || generateRandomSeed();
  seedInput.value = currentSeed;
  setSeedInURL(currentSeed);

  renderPlaceholder(ctx);

  // Auto-generate when arriving via a shared seed link
  if (getSeedFromURL()) {
    generateMap(currentSeed);
  }

  // Generate
  btnGenerate.addEventListener('click', () => {
    const raw = seedInput.value;
    currentSeed = (raw.trim() && parseSeed(raw)) || generateRandomSeed();
    seedInput.value = currentSeed;
    updateSeedValidity(currentSeed);
    setSeedInURL(currentSeed, true);
    generateMap(currentSeed);
  });

  // Enter key in seed input triggers generate
  seedInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const raw = seedInput.value;
    currentSeed = (raw.trim() && parseSeed(raw)) || generateRandomSeed();
    seedInput.value = currentSeed;
    updateSeedValidity(currentSeed);
    setSeedInURL(currentSeed, true);
    generateMap(currentSeed);
  });

  // Seed input live validation
  seedInput.addEventListener('input', () => {
    updateSeedValidity(seedInput.value.trim());
  });

  // Copy seed
  btnCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentSeed);
      btnCopy.setAttribute('data-copied', 'true');
      btnCopy.setAttribute('aria-label', 'Copied!');
      setTimeout(() => {
        btnCopy.removeAttribute('data-copied');
        btnCopy.setAttribute('aria-label', 'Copy seed to clipboard');
      }, 2000);
    } catch {
      // Clipboard API unavailable — select text as fallback
      seedInput.select();
    }
  });

  // Export
  btnExport.addEventListener('click', () => exportPNG());

  // Handle browser back/forward with hash changes
  window.addEventListener('hashchange', () => {
    const urlSeed = getSeedFromURL();
    if (urlSeed && urlSeed !== currentSeed) {
      currentSeed = urlSeed;
      seedInput.value = currentSeed;
      generateMap(currentSeed);
    }
  });
}

// ── Map generation ────────────────────────────────────

function generateMap(seed) {
  if (isGenerating) return;
  isGenerating = true;

  const btnGenerate = document.getElementById('btn-generate');
  const loadingState = document.querySelector('.map-state--loading');
  const errorState = document.querySelector('.map-state--error');

  btnGenerate.setAttribute('aria-busy', 'true');
  btnGenerate.disabled = true;
  if (loadingState) loadingState.removeAttribute('hidden');
  if (errorState) errorState.setAttribute('hidden', '');

  // Defer one frame so the UI updates before the CPU-bound work begins
  requestAnimationFrame(() => {
    try {
      const terrain = generateTerrain(seed);
      renderMap(ctx, terrain);
      if (loadingState) loadingState.setAttribute('hidden', '');
    } catch {
      if (loadingState) loadingState.setAttribute('hidden', '');
      if (errorState) errorState.removeAttribute('hidden');
    } finally {
      btnGenerate.removeAttribute('aria-busy');
      btnGenerate.disabled = false;
      isGenerating = false;
    }
  });
}

// ── PNG export ────────────────────────────────────────

function exportPNG() {
  const exportCanvas = document.createElement('canvas');
  const scale = 2;
  exportCanvas.width = CANVAS_W * scale;
  exportCanvas.height = CANVAS_H * scale;
  const exportCtx = exportCanvas.getContext('2d');
  exportCtx.scale(scale, scale);
  exportCtx.drawImage(canvas, 0, 0, CANVAS_W, CANVAS_H);

  const link = document.createElement('a');
  link.download = `cartographers-palette-${currentSeed}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}

document.addEventListener('DOMContentLoaded', init);

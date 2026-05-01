// Phase 3: terrain generation algorithm.
// generateTerrain is a stub until Phase 3 is implemented.
import { createNoise, fbm } from './noise.js';
import { mulberry32, fnv1a } from './prng.js';

export const GRID_W = 800;
export const GRID_H = 550;

// Terrain classification — ordered from lowest to highest elevation.
export const TERRAIN = [
  { id: 'ocean-deep', threshold: 0.1, rgb: [29, 61, 92] },
  { id: 'ocean-shallow', threshold: 0.3, rgb: [46, 98, 136] },
  { id: 'coast', threshold: 0.42, rgb: [201, 184, 122] },
  { id: 'lowland', threshold: 0.62, rgb: [122, 158, 85] },
  { id: 'highland', threshold: 0.78, rgb: [139, 110, 58] },
  { id: 'mountain', threshold: 0.91, rgb: [176, 160, 144] },
  { id: 'snow', threshold: Infinity, rgb: [232, 223, 208] },
];

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Generates terrain height data for a given hex seed string.
 * Returns { grid: Float32Array, width: number, height: number }
 * where grid values are in [0, 1].
 */
export function generateTerrain(seedHex) {
  const seed = fnv1a(seedHex);
  const rng = mulberry32(seed);
  const noise = createNoise(rng);

  // PRNG-seeded variation parameters
  const offsetX = rng() * 800;
  const offsetY = rng() * 800;
  const stretch = 0.75 + rng() * 0.5;
  const maskRadius = 0.42 + rng() * 0.12;

  const grid = new Float32Array(GRID_W * GRID_H);

  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const nx = (x / GRID_W - 0.5) * 3.5 + offsetX;
      const ny = (y / GRID_H - 0.5) * 3.5 * stretch + offsetY;

      let h = fbm(noise, nx, ny, 6, 2.0, 0.5);
      h = (h + 1) * 0.5; // remap to [0, 1]

      // Radial island mask
      const dx = (x / GRID_W - 0.5) * 2;
      const dy = ((y / GRID_H - 0.5) * 2) / stretch;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Perturb the mask boundary so coastlines aren't circular
      const maskNoise = fbm(noise, nx * 0.25, ny * 0.25, 3, 2.0, 0.5);
      const perturbedDist = dist + maskNoise * 0.28;
      const mask = 1 - smoothstep(maskRadius, 0.95, perturbedDist);

      grid[y * GRID_W + x] = Math.max(0, Math.min(1, h * mask));
    }
  }

  return { grid, width: GRID_W, height: GRID_H };
}

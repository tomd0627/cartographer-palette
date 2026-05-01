// Simplex noise — adapted from Stefan Gustavson's public domain implementation.
// Reference: https://staffwww.itn.liu.se/~stegu/simplexnoise/SimplexNoise.java
//
// Key change from the original: the permutation table is seeded via a supplied
// PRNG function so every map seed produces a distinct noise field.

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

// 2D gradient vectors for 12 directions (x, y pairs stored flat)
const GRAD2 = new Float32Array([
  1, 1, -1, 1, 1, -1, -1, -1, 1, 0, -1, 0, 1, 0, -1, 0, 0, 1, 0, -1, 0, 1, 0, -1,
]);

/**
 * Returns a 2D simplex noise function seeded by the supplied PRNG.
 * @param {() => number} rng - A PRNG returning floats in [0, 1).
 * @returns {(x: number, y: number) => number} Noise value in [-1, 1].
 */
function createNoise(rng) {
  // Fisher-Yates shuffle of 0–255 using the provided PRNG
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }

  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  return function noise2d(xin, yin) {
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const t = (i + j) * G2;

    const x0 = xin - (i - t);
    const y0 = yin - (j - t);

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = permMod12[ii + perm[jj]] * 2;
    const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 2;
    const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 2;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    const n0 = t0 < 0 ? 0 : ((t0 *= t0), t0 * t0 * (GRAD2[gi0] * x0 + GRAD2[gi0 + 1] * y0));

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    const n1 = t1 < 0 ? 0 : ((t1 *= t1), t1 * t1 * (GRAD2[gi1] * x1 + GRAD2[gi1 + 1] * y1));

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    const n2 = t2 < 0 ? 0 : ((t2 *= t2), t2 * t2 * (GRAD2[gi2] * x2 + GRAD2[gi2 + 1] * y2));

    return 70 * (n0 + n1 + n2); // scaled to roughly [-1, 1]
  };
}

/**
 * Fractional Brownian Motion — layers multiple octaves of noise.
 * Returns a value in approximately [-1, 1].
 */
function fbm(noise2d, x, y, octaves = 6, lacunarity = 2.0, persistence = 0.5) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let normFactor = 0;

  for (let i = 0; i < octaves; i++) {
    value += noise2d(x * frequency, y * frequency) * amplitude;
    normFactor += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return value / normFactor;
}

export { createNoise, fbm };

const SEED_CHARS = 8;
const HASH_KEY = 'seed';
const VALID_SEED = /^[0-9a-f]{8}$/i;

/** Generates a random 8-character hex seed string. */
function generateRandomSeed() {
  return ((Math.random() * 0xffffffff) >>> 0).toString(16).padStart(SEED_CHARS, '0');
}

/**
 * Normalises a user-supplied string to a valid 8-char hex seed.
 * Returns null if the input cannot be salvaged.
 */
function parseSeed(raw) {
  const clean = String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-f]/g, '');
  if (clean.length === 0) return null;
  return clean.slice(0, SEED_CHARS).padEnd(SEED_CHARS, '0');
}

/** Returns true if str is a valid seed. */
function isValidSeed(str) {
  return VALID_SEED.test(str);
}

/** Reads the seed from the URL hash (#seed=…). Returns null if absent. */
function getSeedFromURL() {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  const seed = params.get(HASH_KEY);
  return seed && isValidSeed(seed) ? seed.toLowerCase() : null;
}

/** Writes the seed into the URL hash without triggering a page navigation. */
function setSeedInURL(seed, push = false) {
  const params = new URLSearchParams();
  params.set(HASH_KEY, seed);
  history[push ? 'pushState' : 'replaceState'](null, '', `#${params.toString()}`);
}

export { generateRandomSeed, parseSeed, isValidSeed, getSeedFromURL, setSeedInURL };

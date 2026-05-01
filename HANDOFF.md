# HANDOFF.md — Session continuity

> To resume: read CLAUDE.md and this file, then continue from where we left off.

---

## Current phase

**Phase 4 complete — UI controls, seed system, PNG export verified**

---

## What was just completed

Phase 4 verified all interactive UI features. Four bugs/issues were found and fixed:

1. **Back/forward navigation** — `setSeedInURL` always used `replaceState`, so generating two maps never created two history entries. Fixed by adding a `push` parameter to `setSeedInURL` and passing `true` from the generate button and Enter key handlers.

2. **Stale "How It Works" copy** — Step 2 still said "512×352 grid" and Step 5 said "twice over" — both outdated after Phase 3 changes. Updated to "800×550" and "once".

3. **Validation not visible** — the `:invalid` red border was invisible when focused because the `:focus` gold `box-shadow` dominated. Fixed by adding a `.seed-input:focus:invalid` rule (higher specificity) that switches to a red glow.

4. **Validation UX** — browser hover tooltip for `setCustomValidity` is not touch-friendly or discoverable. Added a `<p id="seed-error">` element below the input, wired to show/hide in the `input` handler and cleared by the generate handlers via a shared `updateSeedValidity()` helper.

---

## Exact next task

**Phase 5: Pre-commit tooling — Husky, ESLint, Stylelint, Prettier**

`npm install` has not been run. `node_modules/` does not exist. All deps are in `package.json` already. No config files exist yet.

Steps:
1. Write `eslint.config.js` (ESLint 9 flat config) — `no-console`, `no-unused-vars`, `eqeqeq`
2. Write `.stylelintrc.json` — `stylelint-config-standard`, `stylelint-order` (alphabetical), logical-properties rule
3. Write `.prettierrc` — formatting for HTML, CSS, JS
4. Write `.editorconfig` — LF line endings, trailing newline, no trailing whitespace
5. Add `lint-staged` config to `package.json`
6. Run `npm install`
7. Run `npx husky init` and write the pre-commit hook
8. Test: make a dirty commit and confirm hooks run and block/fix it

---

## Decisions made this session not yet reflected in CLAUDE.md

All decisions from this session are now captured in CLAUDE.md.

---

## Known gotchas / unfinished work

- `npm install` has not been run yet — `node_modules/` doesn't exist, Husky is not set up. This is expected; Phase 5 handles tooling.
- The `type="module"` script requires an HTTP server — `file://` will produce CORS errors.
- `OffscreenCanvas` is used in `renderer.js`. Confirmed working in Chrome/Brave. Test in Safari ≥ 16.4 before final deploy.
- The compass rose font (`Courier Prime`) is drawn on canvas via `ctx.font`. Renders correctly only after `document.fonts.ready` resolves, which `main.js` awaits before calling `renderPlaceholder`.
- Auto-generates on every fresh page load (not just shared links) — this is intentional; visitors always see a map immediately.

---

## Remaining phases

| Phase | Description | Status |
|---|---|---|
| 1 | Pre-code declaration | ✅ Complete |
| 2 | Core HTML/CSS scaffold + Canvas setup | ✅ Complete |
| 3 | Generation algorithm verification | ✅ Complete |
| 4 | UI controls, seed system, PNG export — verify all work | ✅ Complete |
| 5 | Pre-commit tooling (Husky, ESLint, Stylelint, Prettier) | Next |
| 6 | Recruiter audit + Lighthouse + finalize README | After 5 |

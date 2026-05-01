# HANDOFF.md — Session continuity

> To resume: read CLAUDE.md and this file, then continue from where we left off.

---

## Current phase

**Phase 5 complete — Pre-commit tooling wired and verified**

---

## What was just completed

Phase 5 set up all pre-commit tooling. Notable decisions and gotchas:

1. **ESLint 9 flat config** — uses `eslint.config.js`, not `.eslintrc`. Requires `"type": "module"` in `package.json` to avoid a performance warning about the config file parsing as CJS.

2. **Stylelint BEM pattern** — `stylelint-config-standard` defaults to strict kebab-case selectors, which rejects BEM names like `.btn--generate`. Overridden with a regex that permits `block__element--modifier` structure.

3. **`rule-empty-line-before` disabled** — config-standard requires blank lines before every CSS rule. This conflicts with the tightly grouped legend swatch rules. Disabled since Prettier owns blank-line formatting.

4. **Logical properties not tooling-enforced** — no Stylelint plugin for logical properties is in the deps. It remains a code convention only; CLAUDE.md updated to reflect this.

5. **`.gitattributes` added** — Windows `core.autocrlf=true` was converting LF→CRLF on checkout, which would corrupt Prettier-formatted files. `* text=auto eol=lf` in `.gitattributes` overrides this.

6. **Stylelint `--fix` EPERM on Windows** — lint-staged's Stylelint fix step works correctly (it writes directly); the bare `npx stylelint --fix` command fails with a rename permission error in this environment. Not a blocking issue.

7. **Media queries** — all three `@media (min-width: ...)` calls updated to CSS Level 4 range notation `(width >= N)` to satisfy `stylelint-config-standard`'s `media-feature-range-notation` rule.

---

## Exact next task

**Phase 6: Recruiter audit + Lighthouse + finalize README**

1. **Lighthouse** — run against the local server (port changes each run; check with `npx serve`). Targets: Performance ≥90, Accessibility ≥95, Best Practices ≥95, SEO ≥90. Fix anything below target.
2. **Recruiter audit** — review the page as a hiring manager would: does the "How It Works" section sell the algorithm clearly? Is the canvas impressive on first load? Is the copy tight?
3. **README** — write a portfolio-quality README: project summary, live demo link, algorithm explanation, stack rationale, and instructions for local dev (`npx serve .`).
4. **Commit** and confirm Netlify deploy succeeds (check build log or site URL).

---

## Decisions made this session not yet reflected in CLAUDE.md

All decisions from this session are now captured in CLAUDE.md.

---

## Known gotchas / unfinished work

- The `type="module"` script requires an HTTP server — `file://` will produce CORS errors. Use `npx serve .` for local dev.
- `OffscreenCanvas` is used in `renderer.js`. Confirmed working in Chrome/Brave. Test in Safari ≥ 16.4 before final deploy.
- The compass rose font (`Courier Prime`) is drawn on canvas via `ctx.font`. Renders correctly only after `document.fonts.ready` resolves, which `main.js` awaits before calling `renderPlaceholder`.
- Auto-generates on every fresh page load (not just shared links) — this is intentional; visitors always see a map immediately.
- `npx serve` picks a random available port each run — check the terminal output for the actual URL.

---

## Remaining phases

| Phase | Description | Status |
|---|---|---|
| 1 | Pre-code declaration | ✅ Complete |
| 2 | Core HTML/CSS scaffold + Canvas setup | ✅ Complete |
| 3 | Generation algorithm verification | ✅ Complete |
| 4 | UI controls, seed system, PNG export — verify all work | ✅ Complete |
| 5 | Pre-commit tooling (Husky, ESLint, Stylelint, Prettier) | ✅ Complete |
| 6 | Recruiter audit + Lighthouse + finalize README | Next |

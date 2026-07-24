# T-001: Project scaffold

**Status**: todo
**Depends on**: —

## Goal

`npm run dev` launches a Firefox instance with the extension installed, and
clicking the toolbar icon opens a popup that renders the number of open tabs in
the current window.

## Scope

In:
- WXT project with the Firefox MV3 target.
- TypeScript with `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- Vitest configured, with one trivial passing test to prove the wiring.
- Biome for lint and format.
- The `src/core`, `src/platform`, `src/background`, `src/ui` directories, each with
  an `index.ts` — empty is fine, the boundary is the point.
- npm scripts exactly as listed in CLAUDE.md, including `verify`.
- Manifest: name, description, `permissions: ["tabs", "storage"]`,
  `browser_specific_settings.gecko.id` and `strict_min_version: "139.0"`.

Explicitly out:
- Any grouping logic.
- Any styling beyond what makes the popup legible.
- Chrome target.

## Design notes

Popup reads the tab count directly via the platform layer for now. This is the one
place a shortcut is acceptable, because T-002 replaces it immediately.

`permissions` is `["tabs", "storage"]` and nothing else. If something appears to
need `<all_urls>`, that is a design error — stop and raise it.

## Edge cases

- `npm run verify` must fail loudly if any of typecheck, lint or test fails. Verify
  this by deliberately breaking a type and confirming a non-zero exit code.

## Acceptance criteria

- [ ] `npm run dev` opens Firefox with the extension loaded
- [ ] Popup shows a plausible tab count
- [ ] `npm run verify` passes, and provably fails when a type is broken
- [ ] The four `src/` directories exist and `src/core/` imports nothing from the others

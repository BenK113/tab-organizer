# ADR 0001: Firefox first, Chrome later, one codebase

- **Status**: accepted
- **Date**: 2026-07-24

## Context

Firefox is my daily browser and the problem I am solving is my own. Chrome has the
larger extension market, and browser extension APIs are close to compatible under
MV3 but not identical: Chrome uses a service worker background, Firefox uses a
non-persistent event page; the `tabGroups` API arrived in Firefox later
(`tabs.group()` in 138, `tabGroups.update()` in 139) and differs in detail.

## Options considered

### Option A: Firefox-only, `browser.*` directly
- Upside: simplest possible code, no abstraction tax.
- Downside: a later Chrome port touches every file.

### Option B: Cross-browser from day one, both targets in CI
- Upside: no port ever needed.
- Downside: doubles the manual test surface for a v1 nobody but me runs, and forces
  design compromises around the weaker of the two APIs.

### Option C: Firefox-only behaviour, cross-browser-capable structure
- Upside: ship fast, port cheaply. `webextension-polyfill` plus WXT's multi-target
  build means the Chrome target is mostly a build flag.
- Downside: a small amount of indirection I do not use yet.

## Decision

Option C. Ship and test Firefox only, with `strict_min_version: "139.0"`. All
browser access is confined to `src/platform/`, so the eventual Chrome port is a
change to one directory rather than to the codebase.

## Consequences

- CI builds only the Firefox target for now.
- `src/platform/capabilities.ts` exists from the start, even though it currently
  answers exactly one question.
- Any Chrome-specific workaround found later goes in the platform layer or it does
  not go in at all.

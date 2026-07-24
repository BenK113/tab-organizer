# CLAUDE.md — Tab Organizer

## What this is

A Firefox (MV3) WebExtension that turns hundreds of open tabs into a small number
of meaningful tab groups. It always shows a **preview** of what it intends to do
and lets the user apply or discard it. Nothing is ever regrouped silently.

Primary user: me. Publishing on AMO is a goal, not a constraint on the design.

## Non-negotiables

1. **No LLM calls in v1.** Grouping is deterministic and offline. AI is a v2
   experiment behind a feature flag, never a dependency.
2. **Never mutate tabs except through an applied plan.** Every write goes through
   `applyPlan()`, and every apply produces an undo snapshot.
3. **No telemetry, no analytics, no network calls.** Any new host permission
   requires an ADR.
4. **The pure core never imports `browser.*`.** See Architecture below.

## Architecture (short version)

Functional core, imperative shell. Full text: @docs/ARCHITECTURE.md

    src/core/        Pure TypeScript. Input: TabInfo[] + Config. Output: GroupPlan.
                     No browser APIs, no I/O, no Date.now(), no randomness.
                     Fully unit-tested. All interesting logic lives here.
    src/platform/    The only place `browser.*` is allowed. Thin adapters that
                     convert browser objects to and from core types.
    src/background/  Event wiring and orchestration. No decisions.
    src/ui/          React popup and options page. Renders a GroupPlan. No logic.

If you are writing an `if` in `src/platform/` or `src/ui/`, the decision almost
certainly belongs in `src/core/`.

## Stack

- TypeScript, `strict: true`. `any` is a review failure; use `unknown` + narrowing.
- WXT (Vite-based extension framework) for build and manifest generation.
- React for popup and options page only.
- Vitest for unit tests.
- Biome for lint and format (one tool, no ESLint/Prettier split).
- `tldts` for eTLD+1 extraction, `webextension-polyfill` for promise-based APIs.

Minimum Firefox version: **139**. `tabs.group()` and `tabs.ungroup()` landed in
Firefox 138; `tabGroups.update()` (title, colour, collapsed state) landed in 139.
Set `strict_min_version` accordingly and never assume Chrome parity.

## Commands

    npm run dev          # WXT dev server, launches Firefox with the extension
    npm run build        # production build into .output/
    npm run zip          # AMO-ready archive
    npm run test         # vitest run
    npm run test:watch
    npm run typecheck    # tsc --noEmit
    npm run lint         # biome check
    npm run verify       # typecheck + lint + test — must pass before any commit

## How we work

**Ticket-driven.** Work comes from `docs/tickets/`. One ticket, one branch. If I
ask for something that is not in a ticket, ask whether to write the ticket first.
Never silently expand scope.

**Plan before code.** For anything touching more than one file, use plan mode and
present the plan. Wait for my explicit "go" before editing anything.

**Tests first in `src/core/`.** Write the failing test, show me the run, then
implement. Adapters in `src/platform/` should be thin enough not to need tests.

**Small diffs.** If a change would exceed roughly 200 lines, stop and propose a
split. I review every line; a diff I cannot read in one sitting is a diff I
cannot approve.

**Architectural decisions are mine.** Data model, module boundaries, the grouping
heuristics themselves: present options with honest tradeoffs, do not pick one.
Once I decide, record it with `/adr`.

**I run git.** You may run `git status`, `git diff`, `git log`. You do not branch,
merge, or push. Commits only when I ask in that same message.

**Dependencies.** Ask before adding any. State the bundle-size cost and the
alternative of writing it ourselves.

## Definition of Done

- [ ] `npm run verify` passes
- [ ] New logic in `src/core/` has tests covering the edge cases named in the ticket
- [ ] No new `any`, no new `!` non-null assertion, no `@ts-expect-error` without a
      comment explaining why
- [ ] Extension still loads in Firefox and the popup still works
- [ ] Every acceptance criterion in the ticket is ticked
- [ ] If an architectural decision was made, an ADR exists

## Rules

@.claude/rules/typescript.md
@.claude/rules/webextension.md

## Things that will otherwise waste your time

- `browser.tabs.query({})` returns tabs from every window. The core always takes
  an explicit `windowId`.
- Firefox MV3 uses a **non-persistent background event page**, not a Chrome-style
  service worker. Module-level state does not survive; persist to
  `browser.storage.session`.
- Privileged pages (`about:`, `moz-extension:`, `view-source:`) cannot be grouped
  or moved. Filter them in the platform adapter, never in the core.
- Firefox requires `browser_specific_settings.gecko.id` for AMO signing. Do not
  remove it.

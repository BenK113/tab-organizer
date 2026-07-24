# Architecture

## The one idea

**Functional core, imperative shell.** All decisions are made by pure functions
that take plain data and return plain data. All effects — reading tabs, moving
tabs, storing settings — live in a thin layer that makes no decisions.

This is not architecture astronautics. It buys three concrete things:

1. The grouping logic is testable without a browser. No mocks, no fixtures, no
   headless Firefox in CI. Just `buildPlan(tabs, config)` and an assertion.
2. The preview UI comes for free. Because the plan is computed before anything is
   applied, showing the user what will happen is simply rendering the plan.
3. Undo comes almost for free. `applyPlan` returns a snapshot of what it changed.

## Data flow

    browser.tabs.query()
            |
            v
    [platform] toTabInfo()          strip privileged URLs, normalise shape
            |
            v
    [core] buildPlan(tabs, config)  PURE — the entire product is here
            |
            v
    [ui] <PlanPreview plan={...} />  user edits labels, excludes groups, applies
            |
            v
    [platform] applyPlan(plan) -> Snapshot
            |
            v
    [platform] restore(snapshot)     undo

## Core types

```ts
type TabInfo = {
  id: number;
  windowId: number;
  index: number;
  url: string;
  title: string;
  lastAccessed: number;      // epoch ms, passed IN — core never calls Date.now()
  pinned: boolean;
  groupId: number | null;
};

type GroupProposal = {
  key: string;               // stable identity, e.g. "domain:github.com"
  label: string;
  color: GroupColor;
  tabIds: number[];
  reason: string;            // human-readable, shown in the preview
};

type DuplicateCluster = {
  canonicalUrl: string;
  keep: number;              // tab id to keep
  close: number[];           // tab ids proposed for closing
};

type GroupPlan = {
  windowId: number;
  groups: GroupProposal[];
  ungrouped: number[];
  duplicates: DuplicateCluster[];
  stats: { tabCount: number; groupCount: number; wouldClose: number };
};

// pure
declare function buildPlan(tabs: TabInfo[], config: Config, now: number): GroupPlan;

// impure, in src/platform/
declare function applyPlan(plan: GroupPlan): Promise<Snapshot>;
declare function restore(snapshot: Snapshot): Promise<void>;
```

`reason` on every proposal is deliberate. A grouping the user cannot explain is a
grouping the user will not trust, and the field costs nothing to carry.

## Grouping pipeline (v1, all deterministic)

Each stage is a pure function `(TabInfo[], Config) => Partial<GroupPlan>`, applied
in order, each consuming what the previous one left ungrouped:

1. **Pinned and privileged** — removed from consideration entirely.
2. **Duplicates** — same canonical URL (see T-003). Proposed for closing, never
   closed automatically.
3. **Explicit rules** — user-defined domain-to-label mapping from config. Always
   wins over anything inferred.
4. **Known services** — a small built-in map (`github.com` and `stackoverflow.com`
   to "Dev", and so on). Data, not code — a JSON table that is easy to extend.
5. **Domain clustering** — group by eTLD+1 when at least `minGroupSize` tabs share
   one. This alone handles most of the mess.
6. **Title clustering** — for what remains, Jaccard similarity over normalised
   title tokens with a threshold. Deliberately last, because it is the stage most
   likely to produce nonsense.
7. **Stale** — untouched for longer than `staleAfterDays`, proposed for an
   "Archive" group. Uses the `now` parameter, never the ambient clock.

Stages 3 through 7 are individually toggleable in config. That is what makes the
v2 AI stage cheap to add later: it becomes stage 6.5, off by default, and the rest
of the system does not know or care that it exists.

## Where AI goes (v2, not now)

An optional stage that takes only the *ungrouped remainder* and proposes labels.
It never sees every tab, never runs without an explicit click, and its output is
merged into the same `GroupPlan` type as everything else. If it is unavailable or
slow, the plan is simply the deterministic one. Building the deterministic version
first is what makes this safe rather than a rewrite.

## Testing strategy

- `src/core/` — unit tests, target 100 % branch coverage. This is cheap because
  everything is a pure function over plain objects.
- `src/platform/` — no unit tests. If an adapter needs a test, it is doing too
  much; move the logic into the core.
- `src/ui/` — a handful of render tests on `PlanPreview` with a hand-written plan.
- Manual — a checklist in `docs/MANUAL-TEST.md`, run before every release. Some
  things (does the group actually appear in the tab strip?) only a human can see.

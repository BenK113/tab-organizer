# T-004: Domain clustering stage

**Status**: todo
**Depends on**: T-003

## Goal

A pure function that turns a list of tabs into domain-based group proposals plus a
remainder, handling the single most common form of tab clutter.

## Design notes

```ts
export function clusterByDomain(
  tabs: TabInfo[],
  config: { minGroupSize: number; maxGroups: number },
): { groups: GroupProposal[]; remaining: TabInfo[] };
```

- Bucket by `registrableDomain`. Tabs with no registrable domain go straight to
  `remaining`.
- A bucket becomes a group only at `minGroupSize` or more (default 3). Smaller
  buckets go to `remaining` — two tabs is not clutter.
- Sort groups by size descending. Ties break by domain name ascending, so the
  output is **stable**: the same input must always produce byte-identical output.
  Test this explicitly; a plan that reshuffles between runs is unusable in a
  preview UI.
- If there are more qualifying buckets than `maxGroups`, keep the largest and send
  the rest to `remaining`. Do not silently create forty groups.
- `label` is the domain with the public suffix stripped and the first letter
  capitalised: `github.com` → "Github". Ugly for `t.co`; acceptable for v1, and
  T-011 replaces it with the known-services table.
- `key` is `domain:<registrable domain>` — stable across runs, which is what lets
  the UI remember that I renamed or dismissed a group.
- `reason` is a sentence: "12 Tabs von github.com".
- Colour assignment is deterministic: hash the key into the palette. The same
  domain gets the same colour every time.

## Edge cases

- empty input
- every tab on one domain
- every tab on a different domain (nothing qualifies, everything goes to remaining)
- exactly `minGroupSize` tabs on a domain — boundary, test both sides
- pinned tabs must already have been filtered out upstream; assert they are absent
  rather than handling them here
- subdomains: `mail.google.com` and `docs.google.com` both reduce to `google.com`
  and land in one group. This is intended. Add a test that pins the behaviour so a
  future change to it is a deliberate one.
- 500 tabs — should complete in well under a frame; add a rough timing assertion

## Acceptance criteria

- [ ] Implemented as a pure function, tested
- [ ] Stability test: running it twice on shuffled-but-equivalent input yields
      identical output
- [ ] All edge cases above covered
- [ ] `npm run verify` passes

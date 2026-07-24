# T-003: URL canonicalisation and eTLD+1 extraction

**Status**: todo
**Depends on**: T-001

## Goal

Two pure functions in `src/core/url.ts` that every later stage depends on:
one that reduces a URL to a comparable canonical form, one that extracts the
registrable domain.

## Why

Both duplicate detection and domain clustering are only as good as this file. Get
it wrong and every downstream stage is subtly wrong in ways that are hard to trace.
This is the ticket to be pedantic on.

## Design notes

```ts
/** Returns the registrable domain (eTLD+1), or null for URLs that have none. */
export function registrableDomain(url: string): string | null;

/** Returns a form of the URL suitable for equality comparison between tabs. */
export function canonicalUrl(url: string): string | null;
```

Use `tldts` for the public-suffix logic. Do not hand-roll it — `user.github.io` and
`bbc.co.uk` are why the Public Suffix List exists, and reimplementing it is a
classic way to spend a weekend badly.

`canonicalUrl` rules:
- lowercase scheme and host, drop a trailing dot on the host
- drop the default port (`:443` on https, `:80` on http)
- drop the fragment — but see the edge cases, this one is contentious
- drop known tracking parameters: `utm_*`, `fbclid`, `gclid`, `mc_eid`, `ref`,
  `ref_src`, `igshid`. Keep everything else; a parameter you do not recognise is
  usually load-bearing.
- sort the remaining query parameters by key, so ordering does not defeat equality
- return `null` for anything not `http`/`https`

Both functions return `null` rather than throwing. Invalid URLs are normal input
here, not exceptional.

## Edge cases

Every one of these becomes a test case:

- `https://www.github.com/foo` and `https://github.com/foo` → same domain, and
  decide explicitly whether they are the same canonical URL (proposal: yes, strip a
  leading `www.` only)
- `https://ben.github.io/project` → registrable domain is `ben.github.io`, **not**
  `github.io` — `github.io` is on the Public Suffix List
- `https://www.bbc.co.uk/news` → `bbc.co.uk`
- `http://localhost:3000/` → no registrable domain; must not crash
- `http://192.168.1.10:8080/` → IP host, no registrable domain
- `https://münchen.de` → punycode versus unicode host must compare equal
- `about:blank`, `moz-extension://abc/page.html`, `view-source:https://x.com`,
  `file:///home/…` → `null` from both functions
- `https://x.com/#/route` versus `https://x.com/#/other` → these are *different*
  pages in a hash-routed SPA. Dropping the fragment merges them wrongly. Decide and
  document: proposal is to drop the fragment **unless** it starts with `#/`, which
  is the near-universal marker of hash routing.
- the empty string, and a string that is not a URL at all
- an extremely long URL (data URIs, some OAuth redirects) — must not be
  pathologically slow

## Acceptance criteria

- [ ] Both functions implemented, pure, no `browser.*`, no I/O
- [ ] Every edge case above has a named test
- [ ] The `www.` and the `#/` decisions are recorded in the file's doc comment with
      the reasoning, not just the behaviour
- [ ] `npm run verify` passes

# Tickets

One ticket, one branch, one review. Tickets are the unit of work — `/ticket T-003`
is how a session starts.

A ticket is ready when someone who is not me could implement it without guessing.
If Claude Code asks a clarifying question that the ticket should have answered,
the fix is to update the ticket, not just to answer in chat. The ticket is what
survives.

## Backlog — v1 (target: two weeks)

| ID | Title | Depends on | Est. |
|----|-------|-----------|------|
| T-001 | Project scaffold: WXT + TS strict + Vitest + Biome, loads in Firefox | — | 3h |
| T-002 | Platform adapter: read tabs into `TabInfo[]`, filter privileged URLs | T-001 | 2h |
| T-003 | URL canonicalisation and eTLD+1 extraction | T-001 | 3h |
| T-004 | Domain clustering stage | T-003 | 3h |
| T-005 | `GroupPlan` type + `buildPlan()` pipeline skeleton | T-004 | 2h |
| T-006 | `applyPlan()` + capability detection + `Snapshot` | T-002, T-005 | 4h |
| T-007 | Popup: render plan preview, apply, discard | T-005, T-006 | 5h |
| T-008 | Undo via snapshot restore | T-006 | 2h |
| T-009 | Duplicate detection stage | T-003 | 2h |
| T-010 | Options page + config persistence in `storage.local` | T-007 | 3h |
| T-011 | Known-services table + user-defined rules | T-005 | 2h |
| T-012 | Title-similarity clustering for the remainder | T-005 | 4h |
| T-013 | GitHub Actions: typecheck, lint, test, build artifact | T-001 | 2h |
| T-014 | Stale-tab detection into an "Archive" group | T-005 | 2h |

**v1 is done when T-001 to T-010 and T-013 are done.** T-011, T-012 and T-014 are
nice to have. Everything about AI is v2 and deliberately not in this table.

T-001, T-003 and T-004 are written out in full below as examples of the level of
detail a ticket needs. Write the rest in the same shape as you get to them — or
have Claude Code draft one from this table and then correct it, which is faster
and works well.

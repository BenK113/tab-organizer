# ADR 0002: Deterministic heuristics in v1, AI only in v2

- **Status**: accepted
- **Date**: 2026-07-24

## Context

The original idea was "group tabs using AI". An LLM can absolutely produce
plausible groupings from a list of titles and URLs. But it is slow (seconds, on a
UI action the user expects to be instant), non-deterministic (the same tabs produce
different groups on different runs, which destroys trust), costly or dependent on a
local model, and it sends browsing data somewhere.

Separately: the majority of the actual mess is one domain repeated many times. That
does not need a language model.

## Options considered

### Option A: LLM-first
- Upside: handles semantic grouping ("these six tabs are all about my tax return")
  that no heuristic will catch.
- Downside: everything above. Also, with no deterministic baseline, there is
  nothing to measure the LLM's output against.

### Option B: Heuristics only, forever
- Upside: fast, private, free, testable.
- Downside: leaves the genuinely interesting cases on the table.

### Option C: Heuristics now, AI as an opt-in stage over the remainder
- Upside: instant and private by default; the AI stage gets the small hard subset
  rather than everything; the deterministic baseline is the thing I compare against.
- Downside: two code paths eventually.

## Decision

Option C. v1 ships zero LLM calls. The pipeline is built as ordered stages
(ARCHITECTURE.md) so that an AI stage can be inserted later without restructuring.

## Consequences

- No network permission in the v1 manifest at all. Adding one later is a visible,
  reviewable event rather than a silent capability.
- I will find out how far heuristics actually get before deciding what the AI
  needs to do — which is the whole point.
- When the AI stage is built, it has an obvious success criterion: does it beat
  stage 6 on the tabs stage 6 got wrong?

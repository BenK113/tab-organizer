---
description: Record an architectural decision
argument-hint: [short title]
allowed-tools: Read, Glob, Edit, Write
---

Create a new ADR in `docs/adr/` for: **$ARGUMENTS**

Use `docs/adr/0000-template.md` as the structure. Number it as the next free
integer and slugify the title for the filename.

Fill in Context, Options considered (at least two, each with an honest downside),
Decision, and Consequences.

Write the reasoning we actually used in this conversation. Do not invent
rationale I never gave — if you are missing the *why* behind the decision, ask me
for it rather than reconstructing something plausible. A fabricated rationale in
an ADR is worse than no ADR, because I will believe it in six months.

Keep it under one page.

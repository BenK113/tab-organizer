---
description: Start work on a ticket from docs/tickets — plan first, no code
argument-hint: [ticket id, e.g. T-003]
allowed-tools: Read, Glob, Grep, Bash(npm run test:*), Bash(npm run typecheck), Bash(git status), Bash(git diff:*)
---

Read the ticket file matching `docs/tickets/$1-*.md`, plus `CLAUDE.md` and
`docs/ARCHITECTURE.md`.

**Do not write any code yet.** Produce, in this order:

1. **Restated goal** — one sentence, in your own words. If your restatement
   differs from the ticket, that means the ticket is ambiguous: say so explicitly.
2. **Open questions** — anything the ticket does not pin down. If there are none,
   write "none" rather than inventing detail to fill the section.
3. **Files** — exactly which files you will create or change, and why each one.
4. **Test plan** — the test cases you will write first, as test titles, including
   every edge case named in the ticket.
5. **Risks** — what could go wrong, and what you are genuinely unsure about.

Then stop and wait. I will reply "go" or send corrections.

Only after "go": write the failing tests, run them, show me the failing output,
and then implement until green. Do not skip showing me the red test run — that is
the evidence the test is actually testing something.

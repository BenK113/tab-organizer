---
description: Strict review of the working-tree diff against our quality bar
allowed-tools: Read, Glob, Grep, Bash(git diff:*), Bash(git status), Bash(npm run verify)
---

Review the current diff (`git diff HEAD`). Act as a strict reviewer, not as the
author of this code. You are looking for reasons to reject it.

Check, in this order:

1. Does anything in `src/core/` import `browser.*`, perform I/O, call `Date.now()`,
   or use randomness? That is an automatic blocker.
2. New `any`, non-null assertions, or `@ts-expect-error` without justification.
3. Untested branches in `src/core/`. Name the specific uncovered input.
4. Logic that leaked into `src/platform/` or `src/ui/`.
5. Scope creep — anything in the diff the ticket did not ask for.
6. Naming that will not make sense to me in three months.
7. Error paths: what happens when a browser API rejects, or a tab closes mid-apply?

Output a numbered list. Each item: severity (**blocker** / should-fix / nit),
`file:line`, and the concrete fix. Finish with a one-line verdict: SHIP or REWORK.

Do not fix anything. Review only.

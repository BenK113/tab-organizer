# TypeScript rules

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- No `any`. Use `unknown` and narrow. If you truly cannot type it, write a
  `// TYPE-DEBT:` comment explaining what you would need in order to type it.
- No non-null assertions (`!`). Handle the undefined case or prove it away with a
  type guard.
- Prefer `type` over `interface` unless you need declaration merging.
- Discriminated unions over optional-field soup. A `GroupProposal` that is
  sometimes a duplicate cluster is two types, not one type with three optionals.
- Functions in `src/core/` are pure: same input, same output, no side effects.
  Time and randomness are parameters, never ambient calls.
- Exported functions get a one-line doc comment stating what they *guarantee*,
  not what they do. "Returns groups sorted by size descending, stable for equal
  sizes" is useful. "Groups the tabs" is not.
- Errors: the core returns `Result<T, E>`-style unions. Throwing is reserved for
  genuine programmer error (violated invariants).

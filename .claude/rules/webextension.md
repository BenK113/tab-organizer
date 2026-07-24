# WebExtension rules (Firefox MV3)

- Always `import browser from "webextension-polyfill"`. Never touch a global
  `chrome` object.
- The background script is a **non-persistent event page**. Assume it is torn
  down between events. State that must survive goes to `browser.storage.session`
  (ephemeral) or `browser.storage.local` (persistent). Module-level variables are
  a cache, never a source of truth.
- Feature-detect before use. `tabGroups` may be absent on older Firefox builds and
  on forks. Detect once in `src/platform/capabilities.ts` and degrade gracefully;
  never let a missing API throw into the UI.
- Every `browser.*` call can reject. Tabs close mid-operation, windows disappear,
  the user drags things around while a plan is applying. Each apply step must
  leave the browser consistent on partial failure, with the undo snapshot valid.
- Skip privileged URLs: `about:`, `moz-extension:`, `chrome:`, `view-source:`,
  and `file:`. Filter them in the adapter, never in the core.
- Permissions are minimal and justified. Adding one means editing the manifest
  AND writing an ADR. `<all_urls>` is not acceptable in this project.
- No content scripts, no `executeScript`. This extension reads tab metadata only,
  never page content.

# tab-organizer

A Firefox extension that turns hundreds of open tabs into a handful of tab
groups. It shows you a preview of what it wants to do; nothing moves until you
click apply, and every apply can be undone.

Everything is computed locally. No network calls, no telemetry, no LLM.

**Status:** design done, not built yet. See [docs/DESIGN.md](docs/DESIGN.md).

## Requirements

Firefox 139 or newer — that is when the `tabGroups` WebExtension API became
complete enough (`tabs.group()` landed in 138, `tabGroups.update()` in 139).

## Development

    npm install
    npm run dev        # launches Firefox with the extension loaded
    npm run verify     # typecheck + lint + test — green before every commit
    npm run zip        # AMO-ready archive

## Manual check before a release

The unit tests cover the logic; these are the things only a human can see.

- [ ] Popup opens and shows a plausible tab count
- [ ] Preview lists groups with a readable reason for each
- [ ] Unchecking a group excludes it from the apply
- [ ] Apply actually creates the groups in the tab strip, with the right colours
- [ ] Undo puts everything back, including reopening closed duplicates
- [ ] Applying twice in a row does nothing the second time
- [ ] Pinned tabs and `about:` pages are untouched

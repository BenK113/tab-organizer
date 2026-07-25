# tab-organizer

A Firefox extension that turns hundreds of open tabs into a handful of tab
groups. It shows you a preview of what it wants to do; nothing moves until you
click apply, and every apply can be undone.

Everything is computed locally. No network calls, no telemetry, no LLM.

**Status:** works, in daily use, not published. See [docs/DESIGN.md](docs/DESIGN.md).

## Requirements

Firefox 139 or newer — that is when the `tabGroups` WebExtension API became
complete enough (`tabs.group()` landed in 138, `tabGroups.update()` in 139).

## Installing it for real

Firefox only loads unsigned extensions temporarily: `about:debugging` works for
a session and is gone on restart. For an add-on that stays, Mozilla has to sign
it — which is free, does not mean publishing it, and takes a few minutes.

    npm run zip

That writes two archives to `.output/`:

- `tab-organizer-<version>-firefox.zip` — the extension
- `tab-organizer-<version>-sources.zip` — the sources, which AMO asks for
  because the build is bundled

Then, on [addons.mozilla.org](https://addons.mozilla.org/developers/):

1. **Submit a New Add-on**, and choose **"On your own"** — that is the unlisted
   track: signed for you, not listed in the public directory, not reviewed as a
   public add-on.
2. Upload the firefox zip, then the sources zip when asked.
3. Download the signed `.xpi` once it is ready.
4. Install it: `about:addons` → gear icon → **Install Add-on From File**.

Updates work the same way — bump `version` in `package.json`, zip, upload,
install. The add-on id in `wxt.config.ts` is what ties a new build to the
installed one, so it must not change after the first signed build.

Once installed: **Alt+Shift+O** opens the popup, rebindable under
`about:addons` → gear → **Manage Extension Shortcuts**.

## Development

    npm install
    npm run dev        # launches Firefox with the extension loaded
    npm run verify     # typecheck + lint + test — green before every commit
    npm run build      # production build into .output/firefox-mv3/
    npm run zip        # both archives, ready for AMO

The dev build takes ~2s to open the popup because Vite serves the bundle module
by module. The production build takes ~250ms. Judge the feel of it there, not in
dev.

## Manual check before a release

The unit tests cover the logic; these are the things only a human can see.

- [ ] Popup opens and shows a plausible tab count
- [ ] Preview lists groups with a readable reason for each
- [ ] Expanding a group lists the tabs it would contain
- [ ] Unchecking a group excludes it from the apply
- [ ] Apply actually creates the groups in the tab strip, with the right colours
- [ ] Unchecking "close duplicates" grows the groups it was taking tabs out of
- [ ] Undo puts everything back, including reopening closed duplicates
- [ ] Undo still offered after closing and reopening the popup
- [ ] Applying twice in a row does nothing the second time
- [ ] Pinned tabs and `about:` pages are untouched
- [ ] Toolbar shows the icon, and Alt+Shift+O opens the popup

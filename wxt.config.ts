import { defineConfig } from "wxt";

export default defineConfig({
  // Source lives under src/, so WXT looks for src/entrypoints/ instead of ./entrypoints/.
  srcDir: "src",

  // Auto-imports off, deliberately. WXT can make `browser`, React hooks and our own
  // helpers appear without an import statement. That is convenient and unreadable:
  // you open a file and cannot tell where a name came from. Every import is explicit.
  imports: false,

  modules: ["@wxt-dev/module-react"],

  // Explicit: WXT still defaults Firefox to MV2. Our design assumes MV3 —
  // non-persistent event page, and the tabGroups API we target.
  manifestVersion: 3,

  manifest: {
    name: "Tab Organizer",
    description:
      "Groups your open tabs into a few meaningful groups, with a preview you approve first.",

    // "tabs" to read urls and titles, "storage" for the undo snapshot and settings,
    // "tabGroups" to title and colour a group (tabs.group() itself needs nothing).
    // Nothing else, ever — no host permissions, so the extension cannot read page content.
    permissions: ["tabs", "storage", "tabGroups"],

    browser_specific_settings: {
      gecko: {
        // AMO needs a stable id to sign against. Placeholder — change before submitting.
        id: "tab-organizer@extensions.local",
        // tabGroups.update() (title, colour, collapsed) landed in Firefox 139.
        strict_min_version: "139.0",
        // Required by AMO for extensions new since 2025-11-03. "none" is a real,
        // enforced declaration, not a formality: we transmit nothing, anywhere.
        data_collection_permissions: {
          required: ["none"],
        },
      },
    },
  },
});

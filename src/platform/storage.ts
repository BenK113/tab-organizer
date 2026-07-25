import { browser } from "wxt/browser";
import type { Snapshot } from "./apply";

/**
 * Where the undo snapshot lives between two openings of the popup.
 *
 * The popup is the whole extension (D-010), and it is destroyed the moment it
 * loses focus — which is exactly when the user looks at the result of an apply
 * and decides they hate it. `storage.session` outlives the popup and dies with
 * the browser session, which is the right lifetime for "undo the last thing".
 */

const SNAPSHOT_KEY = "undo.snapshot";

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isArrayOf<T>(value: unknown, item: (element: unknown) => element is T): value is T[] {
  return Array.isArray(value) && value.every(item);
}

function isCreatedGroup(value: unknown): value is Snapshot["createdGroups"][number] {
  return isRecord(value) && isNumber(value.groupId) && isArrayOf(value.tabIds, isNumber);
}

function isClosedTab(value: unknown): value is Snapshot["closedTabs"][number] {
  return isRecord(value) && typeof value.url === "string" && isNumber(value.index);
}

/**
 * Storage hands back `unknown`, and it is not ours: a snapshot written by an
 * older build of the extension survives a reload in dev and would otherwise be
 * trusted at face value. Anything that does not match is treated as absent.
 */
function isSnapshot(value: unknown): value is Snapshot {
  return (
    isRecord(value) &&
    isNumber(value.windowId) &&
    isNumber(value.createdAt) &&
    isArrayOf(value.createdGroups, isCreatedGroup) &&
    isArrayOf(value.closedTabs, isClosedTab)
  );
}

/** Replaces any previous snapshot — only the last apply is undoable. */
export async function saveSnapshot(snapshot: Snapshot): Promise<void> {
  await browser.storage.session.set({ [SNAPSHOT_KEY]: snapshot });
}

/** The last apply's snapshot, or null if there is none we can trust. */
export async function loadSnapshot(): Promise<Snapshot | null> {
  const stored = await browser.storage.session.get(SNAPSHOT_KEY);
  const value: unknown = stored[SNAPSHOT_KEY];

  return isSnapshot(value) ? value : null;
}

export async function clearSnapshot(): Promise<void> {
  await browser.storage.session.remove(SNAPSHOT_KEY);
}

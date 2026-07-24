import { browser } from "wxt/browser";

/**
 * Number of tabs in the window the popup was opened from.
 *
 * Scaffold-level: this exists so the popup has something real to show. Step 3
 * replaces it with readTabs(), which returns TabInfo[] for the core.
 */
export async function countTabsInCurrentWindow(): Promise<number> {
  // currentWindow, not the "last focused" default: browser.tabs.query({}) would
  // return tabs from every open window, which is never what we want.
  const tabs = await browser.tabs.query({ currentWindow: true });
  return tabs.length;
}

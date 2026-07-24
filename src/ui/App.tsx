import { useEffect, useState } from "react";
import { countTabsInCurrentWindow } from "@/platform/tabs";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; tabCount: number }
  | { status: "failed"; message: string };

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    countTabsInCurrentWindow()
      .then((tabCount) => {
        if (!cancelled) setState({ status: "ready", tabCount });
      })
      .catch((error: unknown) => {
        // Every browser.* call can reject. Never let that reach the user as a
        // blank popup — say what happened.
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) setState({ status: "failed", message });
      });

    // React 18+ StrictMode runs effects twice in dev. Without this guard the
    // second run would setState on a component the first run already replaced.
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <h1>Tab Organizer</h1>
      {state.status === "loading" && <p>Reading tabs…</p>}
      {state.status === "ready" && (
        <p>
          <strong>{state.tabCount}</strong> tabs in this window.
        </p>
      )}
      {state.status === "failed" && <p className="error">Could not read tabs: {state.message}</p>}
    </main>
  );
}

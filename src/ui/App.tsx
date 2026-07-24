import { useEffect, useState } from "react";
import { buildPlan } from "@/core/plan";
import { DEFAULT_CONFIG, type GroupColor, type GroupPlan } from "@/core/types";
import { readCurrentWindow } from "@/platform/tabs";

/**
 * Approximations of the tabGroups palette, for the preview dot only. The real
 * colour is applied by the browser on apply; this just has to be recognisable.
 */
const SWATCH: Record<GroupColor, string> = {
  blue: "#3b82f6",
  cyan: "#06b6d4",
  green: "#22c55e",
  grey: "#9ca3af",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#a855f7",
  red: "#ef4444",
  yellow: "#eab308",
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; plan: GroupPlan }
  | { status: "failed"; message: string };

export function App() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    readCurrentWindow()
      .then(({ windowId, tabs }) => {
        if (cancelled) return;
        // Read, then compute. Nothing here writes to the browser — the plan is a
        // proposal until an apply button exists to act on it.
        setState({ status: "ready", plan: buildPlan(windowId, tabs, DEFAULT_CONFIG) });
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!cancelled) setState({ status: "failed", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") return <p>Reading tabs…</p>;
  if (state.status === "failed") {
    return <p className="error">Could not read tabs: {state.message}</p>;
  }

  const { plan } = state;

  return (
    <>
      <p className="summary">
        <strong>{plan.stats.tabCount}</strong> tabs · <strong>{plan.stats.groupCount}</strong>{" "}
        groups proposed
        {plan.stats.wouldClose > 0 && <> · {plan.stats.wouldClose} duplicates</>}
      </p>

      {plan.groups.length === 0 ? (
        <p className="muted">Nothing worth grouping in this window.</p>
      ) : (
        <ul className="groups">
          {plan.groups.map((group) => (
            <li key={group.key}>
              <span className="dot" style={{ background: SWATCH[group.color] }} />
              <span className="label">{group.label}</span>
              <span className="muted">{group.reason}</span>
            </li>
          ))}
        </ul>
      )}

      {plan.ungrouped.length > 0 && (
        <p className="muted footnote">{plan.ungrouped.length} tabs left where they are.</p>
      )}

      <p className="muted footnote">Preview only — nothing is applied yet.</p>
    </>
  );
}

import { useEffect, useState } from "react";
import { buildPlan } from "@/core/plan";
import {
  type Config,
  DEFAULT_CONFIG,
  type GroupColor,
  type GroupPlan,
  type TabInfo,
} from "@/core/types";
import {
  type ApplyResult,
  applyPlan,
  restore,
  type Snapshot,
  supportsTabGroups,
} from "@/platform/apply";
import { clearSnapshot, loadSnapshot, saveSnapshot } from "@/platform/storage";
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

type Phase =
  | { status: "loading" }
  | { status: "unsupported" }
  | { status: "ready"; windowId: number; tabs: TabInfo[] }
  | { status: "working"; label: string }
  | { status: "applied"; result: ApplyResult }
  | { status: "failed"; message: string };

type Loaded = { windowId: number; tabs: TabInfo[]; snapshot: Snapshot | null };

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * One read of the world: the window's organisable tabs, plus an undo snapshot
 * from an earlier apply if this window has one. Reads only — the popup is
 * reopened after every apply and has to be able to run this at any time.
 */
async function readState(): Promise<Loaded> {
  const [{ windowId, tabs }, snapshot] = await Promise.all([readCurrentWindow(), loadSnapshot()]);

  // A snapshot belonging to another window is not ours to offer here.
  return { windowId, tabs, snapshot: snapshot?.windowId === windowId ? snapshot : null };
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ status: "loading" });
  const [undoable, setUndoable] = useState<Snapshot | null>(null);
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [closeDuplicates, setCloseDuplicates] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!supportsTabGroups()) {
      setPhase({ status: "unsupported" });
      return;
    }

    readState()
      .then((loaded) => {
        if (cancelled) return;
        setUndoable(loaded.snapshot);
        setPhase({ status: "ready", windowId: loaded.windowId, tabs: loaded.tabs });
      })
      .catch((error: unknown) => {
        if (!cancelled) setPhase({ status: "failed", message: describe(error) });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApply(plan: GroupPlan): Promise<void> {
    setPhase({ status: "working", label: "Applying…" });

    try {
      const result = await applyPlan(plan, [...excluded]);
      const changed =
        result.snapshot.createdGroups.length > 0 || result.snapshot.closedTabs.length > 0;

      // An apply that changed nothing must not overwrite an older undo with an
      // empty one — the Undo button would then be a lie.
      if (changed) await saveSnapshot(result.snapshot);

      setUndoable(changed ? result.snapshot : undoable);
      setPhase({ status: "applied", result });
    } catch (error: unknown) {
      setPhase({ status: "failed", message: describe(error) });
    }
  }

  async function handleUndo(snapshot: Snapshot): Promise<void> {
    setPhase({ status: "working", label: "Undoing…" });

    try {
      await restore(snapshot);
      await clearSnapshot();
      setUndoable(null);
      setExcluded(new Set());

      // Back to a fresh preview rather than a "done" screen: the tabs just moved,
      // so anything still on screen would be describing a window that is gone.
      const loaded = await readState();
      setPhase({ status: "ready", windowId: loaded.windowId, tabs: loaded.tabs });
    } catch (error: unknown) {
      setPhase({ status: "failed", message: describe(error) });
    }
  }

  function toggleGroup(key: string): void {
    setExcluded((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  if (phase.status === "loading") return <p>Reading tabs…</p>;
  if (phase.status === "working") return <p>{phase.label}</p>;

  if (phase.status === "unsupported") {
    return (
      <p className="error">
        This build of Firefox has no tab groups API. Tab Organizer needs Firefox 139 or newer.
      </p>
    );
  }

  if (phase.status === "failed") {
    return (
      <>
        <p className="error">Something went wrong: {phase.message}</p>
        {undoable !== null && (
          <p className="footnote">
            <button type="button" onClick={() => void handleUndo(undoable)}>
              Undo last apply
            </button>
          </p>
        )}
      </>
    );
  }

  if (phase.status === "applied") {
    const { snapshot, failedKeys } = phase.result;

    return (
      <>
        <p className="summary">
          {snapshot.createdGroups.length === 0 && snapshot.closedTabs.length === 0
            ? "Nothing changed."
            : `Created ${snapshot.createdGroups.length} groups, closed ${snapshot.closedTabs.length} duplicate tabs.`}
        </p>

        {failedKeys.length > 0 && (
          <p className="error footnote">
            {failedKeys.length} groups could not be created. Their tabs were left alone.
          </p>
        )}

        <div className="actions">
          {undoable !== null && (
            <button type="button" onClick={() => void handleUndo(undoable)}>
              Undo
            </button>
          )}
          <button type="button" className="secondary" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </>
    );
  }

  // Two plans, one per answer to the duplicates question. Both are pure and
  // cheap, and computing the other one is what lets the checkbox show its own
  // consequence: with duplicates kept, the groups below get bigger.
  const config: Config = { ...DEFAULT_CONFIG, detectDuplicates: closeDuplicates };
  const plan = buildPlan(phase.windowId, phase.tabs, config);
  const duplicatesFound = buildPlan(phase.windowId, phase.tabs, DEFAULT_CONFIG).stats.wouldClose;

  const selected = plan.groups.filter((group) => !excluded.has(group.key));
  const nothingToDo = selected.length === 0 && plan.stats.wouldClose === 0;

  return (
    <>
      <p className="summary">
        <strong>{plan.stats.tabCount}</strong> tabs · <strong>{selected.length}</strong>{" "}
        {selected.length === 1 ? "group" : "groups"} to create
        {plan.stats.wouldClose > 0 && <> · {plan.stats.wouldClose} duplicates to close</>}
      </p>

      {plan.groups.length === 0 ? (
        <p className="muted">Nothing worth grouping in this window.</p>
      ) : (
        <ul className="groups">
          {plan.groups.map((group) => (
            <li key={group.key}>
              <label className="row">
                <input
                  type="checkbox"
                  checked={!excluded.has(group.key)}
                  onChange={() => toggleGroup(group.key)}
                />
                <span className="dot" style={{ background: SWATCH[group.color] }} />
                <span className="label">{group.label}</span>
                <span className="muted">{group.reason}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {duplicatesFound > 0 && (
        <label className="row duplicates">
          <input
            type="checkbox"
            checked={closeDuplicates}
            onChange={(event) => setCloseDuplicates(event.target.checked)}
          />
          <span>
            Close {duplicatesFound} duplicate tabs
            <span className="muted footnote-inline">
              {" "}
              — undo reopens them, but their history and scroll position are lost
            </span>
          </span>
        </label>
      )}

      {plan.ungrouped.length > 0 && (
        <p className="muted footnote">{plan.ungrouped.length} tabs left where they are.</p>
      )}

      <div className="actions">
        <button type="button" disabled={nothingToDo} onClick={() => void handleApply(plan)}>
          Apply
        </button>
        <button type="button" className="secondary" onClick={() => window.close()}>
          Discard
        </button>
        {undoable !== null && (
          <button type="button" className="secondary" onClick={() => void handleUndo(undoable)}>
            Undo last apply
          </button>
        )}
      </div>
    </>
  );
}

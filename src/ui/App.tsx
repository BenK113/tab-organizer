import { useEffect, useState } from "react";
import { buildPlan } from "@/core/plan";
import {
  type Config,
  DEFAULT_CONFIG,
  type GroupColor,
  type GroupPlan,
  type GroupProposal,
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

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
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

/**
 * One proposed group. Expanding it lists the tabs by title, because "12 tabs
 * from github.com" is a claim, and the user should be able to check it before
 * agreeing to it rather than after.
 */
function GroupRow({
  group,
  tabs,
  selected,
  expanded,
  onSelect,
  onExpand,
}: {
  group: GroupProposal;
  tabs: TabInfo[];
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onExpand: () => void;
}) {
  return (
    <li className={selected ? "group" : "group group-off"}>
      <div className="group-head">
        <label className="group-main">
          <input type="checkbox" checked={selected} onChange={onSelect} />
          <span className="dot" style={{ background: SWATCH[group.color] }} />
          <span className="group-label">{group.label}</span>
          <span className="muted group-reason">{group.reason}</span>
        </label>

        <button
          type="button"
          className="chevron"
          aria-expanded={expanded}
          aria-label={expanded ? `Hide tabs in ${group.label}` : `Show tabs in ${group.label}`}
          onClick={onExpand}
        >
          {expanded ? "⌃" : "⌄"}
        </button>
      </div>

      {expanded && (
        <ul className="tab-list">
          {tabs.map((tab) => (
            <li key={tab.id} title={tab.url}>
              {tab.title === "" ? tab.url : tab.title}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function App() {
  const [phase, setPhase] = useState<Phase>({ status: "loading" });
  const [undoable, setUndoable] = useState<Snapshot | null>(null);
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
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
    setPhase({ status: "working", label: "Grouping tabs…" });

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
    setPhase({ status: "working", label: "Putting it back…" });

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

  function toggle(
    set: ReadonlySet<string>,
    update: (next: ReadonlySet<string>) => void,
    key: string,
  ): void {
    const next = new Set(set);
    if (!next.delete(key)) next.add(key);
    update(next);
  }

  if (phase.status === "loading") return <p className="muted">Reading tabs…</p>;

  if (phase.status === "working") {
    return <p className="muted">{phase.label}</p>;
  }

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
        <div className="actions">
          {undoable !== null && (
            <button type="button" className="primary" onClick={() => void handleUndo(undoable)}>
              Undo last apply
            </button>
          )}
          <button type="button" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </>
    );
  }

  if (phase.status === "applied") {
    const { snapshot, failedKeys } = phase.result;
    const nothingHappened = snapshot.createdGroups.length === 0 && snapshot.closedTabs.length === 0;

    return (
      <>
        <p className="done">
          {nothingHappened
            ? "Nothing changed."
            : `Created ${plural(snapshot.createdGroups.length, "group", "groups")}` +
              (snapshot.closedTabs.length > 0
                ? `, closed ${plural(snapshot.closedTabs.length, "duplicate", "duplicates")}.`
                : ".")}
        </p>

        {failedKeys.length > 0 && (
          <p className="error small">
            {plural(failedKeys.length, "group", "groups")} could not be created. Those tabs were
            left alone.
          </p>
        )}

        <div className="actions">
          {undoable !== null && (
            <button type="button" className="primary" onClick={() => void handleUndo(undoable)}>
              Undo
            </button>
          )}
          <button type="button" onClick={() => window.close()}>
            Close
          </button>
        </div>
      </>
    );
  }

  // Two plans, one per answer to the duplicates question. Both are pure and
  // cheap, and having the other one is what lets the checkbox show its own
  // consequence: with duplicates kept, the groups below get bigger.
  const config: Config = { ...DEFAULT_CONFIG, detectDuplicates: closeDuplicates };
  const plan = buildPlan(phase.windowId, phase.tabs, config);
  const duplicatesFound = buildPlan(phase.windowId, phase.tabs, DEFAULT_CONFIG).stats.wouldClose;

  const byId = new Map(phase.tabs.map((tab) => [tab.id, tab]));
  const selected = plan.groups.filter((group) => !excluded.has(group.key));
  const movingTabs = selected.reduce((total, group) => total + group.tabIds.length, 0);
  const closing = closeDuplicates ? duplicatesFound : 0;
  const nothingToDo = movingTabs === 0 && closing === 0;

  // The button says what it will do, so the summary above it does not have to be
  // read first. "Apply" is only meaningful to someone who already knows.
  const actionLabel =
    movingTabs > 0
      ? `Group ${plural(movingTabs, "tab", "tabs")}`
      : `Close ${plural(closing, "duplicate", "duplicates")}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void handleApply(plan);
      }}
    >
      {undoable !== null && (
        <div className="undo-bar">
          <span className="muted small">An earlier apply can still be undone.</span>
          <button type="button" className="link" onClick={() => void handleUndo(undoable)}>
            Undo
          </button>
        </div>
      )}

      {plan.groups.length === 0 && duplicatesFound === 0 ? (
        <p className="muted">
          Nothing worth grouping here. Every tab is either already in a group, pinned, or the only
          one of its kind.
        </p>
      ) : (
        <>
          <div className="summary">
            <span>
              <strong>{plan.stats.tabCount}</strong> loose tabs · <strong>{selected.length}</strong>{" "}
              of {plan.groups.length} groups
            </span>

            {plan.groups.length > 1 && (
              <span className="pick">
                <button type="button" className="link" onClick={() => setExcluded(new Set())}>
                  All
                </button>
                <button
                  type="button"
                  className="link"
                  onClick={() => setExcluded(new Set(plan.groups.map((group) => group.key)))}
                >
                  None
                </button>
              </span>
            )}
          </div>

          <ul className="groups">
            {plan.groups.map((group) => (
              <GroupRow
                key={group.key}
                group={group}
                tabs={group.tabIds.flatMap((id) => {
                  const tab = byId.get(id);
                  return tab === undefined ? [] : [tab];
                })}
                selected={!excluded.has(group.key)}
                expanded={expanded.has(group.key)}
                onSelect={() => toggle(excluded, setExcluded, group.key)}
                onExpand={() => toggle(expanded, setExpanded, group.key)}
              />
            ))}
          </ul>
        </>
      )}

      {duplicatesFound > 0 && (
        <label className="duplicates">
          <input
            type="checkbox"
            checked={closeDuplicates}
            onChange={(event) => setCloseDuplicates(event.target.checked)}
          />
          <span>
            Close {plural(duplicatesFound, "duplicate tab", "duplicate tabs")}
            <span className="muted small block">
              Undo reopens them, but their history and scroll position are lost.
            </span>
          </span>
        </label>
      )}

      {plan.ungrouped.length > 0 && (
        <p className="muted small footnote">
          {plural(plan.ungrouped.length, "tab stays", "tabs stay")} where they are.
        </p>
      )}

      <div className="actions">
        <button type="submit" className="primary" disabled={nothingToDo}>
          {nothingToDo ? "Nothing selected" : actionLabel}
        </button>
        <button type="button" onClick={() => window.close()}>
          Cancel
        </button>
      </div>
    </form>
  );
}

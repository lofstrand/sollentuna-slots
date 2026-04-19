import { useState, useMemo } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Facility } from "../types";

interface FacilityPickerProps {
  open: boolean;
  selected: number[];
  facilities: Facility[];
  onChange: (ids: number[]) => void;
  onClose: () => void;
}

interface TreeNode {
  id: number;
  label: string;
  children: TreeNode[];
  allIds: number[];
}

function buildGroupTree(groupFacilities: Facility[]): TreeNode[] {
  const sorted = [...groupFacilities].sort(
    (a, b) => a.name.length - b.name.length,
  );
  const nodeMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const f of sorted) {
    const lastComma = f.name.lastIndexOf(",");
    const label =
      lastComma !== -1 ? f.name.slice(lastComma + 1).trim() : f.name;
    const node: TreeNode = { id: f.id, label, children: [], allIds: [f.id] };
    nodeMap.set(f.name, node);

    if (lastComma !== -1) {
      const parentName = f.name.slice(0, lastComma).trim();
      const parent = nodeMap.get(parentName);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  function propagate(node: TreeNode) {
    for (const child of node.children) {
      propagate(child);
      node.allIds.push(...child.allIds);
    }
  }
  roots.forEach(propagate);

  return roots;
}

type CheckState = "checked" | "mixed" | "unchecked";

function checkState(allIds: number[], selected: Set<number>): CheckState {
  const n = allIds.filter((id) => selected.has(id)).length;
  if (n === 0) return "unchecked";
  if (n === allIds.length) return "checked";
  return "mixed";
}

function CheckBox({
  state,
  onClick,
}: {
  state: CheckState;
  onClick: () => void;
}) {
  return (
    <button
      role="checkbox"
      aria-checked={
        state === "checked" ? true : state === "mixed" ? "mixed" : false
      }
      onClick={onClick}
      className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors
        ${
          state === "checked"
            ? "bg-primary text-white"
            : state === "mixed"
              ? "bg-primary-fixed text-primary"
              : "bg-surface-container-high"
        }`}
    >
      {state === "checked" ? "✓" : state === "mixed" ? "–" : ""}
    </button>
  );
}

export function FacilityPicker({
  open,
  selected,
  facilities,
  onChange,
  onClose,
}: FacilityPickerProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const groups = useMemo(
    () => [...new Set(facilities.map((f) => f.group))],
    [facilities],
  );

  const treeByGroup = useMemo(() => {
    const map: Record<string, TreeNode[]> = {};
    for (const group of groups) {
      map[group] = buildGroupTree(facilities.filter((f) => f.group === group));
    }
    return map;
  }, [facilities, groups]);

  const idsByGroup = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const group of groups) {
      map[group] = facilities.filter((f) => f.group === group).map((f) => f.id);
    }
    return map;
  }, [facilities, groups]);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const f of facilities) {
      if (selected.includes(f.id)) s.add(f.group);
    }
    return s;
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  function collectNodeIds(node: TreeNode): number[] {
    return [node.id, ...node.children.flatMap(collectNodeIds)];
  }

  function toggleExpGroup(group: string) {
    const expanding = !expandedGroups.has(group);
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (expanding) next.add(group);
      else next.delete(group);
      return next;
    });
    if (expanding) {
      const allNodeIds = (treeByGroup[group] ?? []).flatMap(collectNodeIds);
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        for (const id of allNodeIds) next.add(id);
        return next;
      });
    }
  }

  function toggleExpNode(node: TreeNode) {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        for (const id of collectNodeIds(node)) next.add(id);
      }
      return next;
    });
  }

  function toggleGroup(group: string) {
    const ids = idsByGroup[group] ?? [];
    const state = checkState(ids, selectedSet);
    if (state === "checked") {
      onChange(selected.filter((id) => !ids.includes(id)));
    } else {
      onChange([...new Set([...selected, ...ids])]);
    }
  }

  function toggleNode(node: TreeNode) {
    if (selectedSet.has(node.id)) {
      onChange(selected.filter((id) => id !== node.id));
    } else {
      onChange([...selected, node.id]);
    }
  }

  function renderNode(node: TreeNode, depth: number): React.ReactNode {
    const isChecked = selectedSet.has(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-3 py-2 px-4 rounded-lg mx-2 transition-colors cursor-pointer ${
            isChecked ? "bg-primary-fixed/20" : "hover:bg-surface-container-low"
          }`}
          style={{ paddingLeft: 16 + depth * 16 }}
          onClick={() => toggleNode(node)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpNode(node);
              }}
              className="w-6 h-6 flex items-center justify-center text-on-surface-variant shrink-0 text-xl"
              aria-label={isExpanded ? "Dölj" : "Expandera"}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <CheckBox
            state={isChecked ? "checked" : "unchecked"}
            onClick={() => toggleNode(node)}
          />
          <span className="text-label-sm font-body text-on-surface flex-1 select-none">
            {node.label}
          </span>
        </div>
        {hasChildren &&
          isExpanded &&
          node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-on-surface/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-surface/90 backdrop-blur-xl focus:outline-none md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md md:max-h-[80vh] md:rounded-xl md:shadow-ambient-lg"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="shrink-0 px-5 pt-4 pb-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-label-sm font-semibold text-on-surface-variant font-body uppercase tracking-wider">
                  Välj anläggning
                </span>
                <Dialog.Title className="font-display text-title-lg text-on-surface mt-0.5">
                  Vart vill du spela?
                </Dialog.Title>
              </div>
              <Dialog.Close
                className="text-on-surface-variant text-2xl leading-none px-2 hover:text-on-surface"
                aria-label="Stäng"
              >
                ✕
              </Dialog.Close>
            </div>
          </div>

          {/* Scrollable groups */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {groups.map((group) => {
              const ids = idsByGroup[group] ?? [];
              const state = checkState(ids, selectedSet);
              const isExpanded = expandedGroups.has(group);
              const tree = treeByGroup[group] ?? [];
              const selectedCount = ids.filter((id) =>
                selectedSet.has(id),
              ).length;

              return (
                <div key={group} className="mb-2">
                  {/* Group card */}
                  <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/40 overflow-hidden">
                    {/* Group header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                      onClick={() => toggleExpGroup(group)}
                    >
                      <CheckBox
                        state={state}
                        onClick={() => {
                          toggleGroup(group);
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-title-md text-on-surface">
                          {group}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCount > 0 && (
                          <span className="text-label-sm font-bold text-primary bg-primary-fixed/30 rounded-full px-2.5 py-1 font-body">
                            {selectedCount} vald{selectedCount !== 1 ? "a" : ""}
                          </span>
                        )}
                        <span className="text-on-surface-variant text-xl">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded tree */}
                    {isExpanded && (
                      <div className="pb-2">
                        {tree.map((node) => renderNode(node, 0))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            className="shrink-0 px-5 py-4 flex gap-3"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="flex-1 bg-surface-container text-on-surface font-bold font-body py-3.5 rounded-md active:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed text-label-lg"
            >
              Rensa urval
            </button>
            <Dialog.Close className="flex-[2] bg-gradient-to-b from-primary to-primary-container text-white font-bold font-body py-3.5 rounded-md active:opacity-90 text-label-lg">
              Visa{" "}
              {selected.length > 0
                ? `${selected.length} anläggning${selected.length !== 1 ? "ar" : ""}`
                : "tider"}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

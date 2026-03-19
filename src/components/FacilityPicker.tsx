import { useState, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import type { Facility } from '../types'

interface FacilityPickerProps {
  open: boolean
  selected: number[]
  facilities: Facility[]
  onChange: (ids: number[]) => void
  onClose: () => void
}

interface TreeNode {
  id: number
  label: string
  children: TreeNode[]
  allIds: number[]   // this node's id + all descendant ids
}

// Build a tree from a flat list of facilities within one group.
// The facility name is a comma-separated path: "Plan, Halvplan, Fjärdedelsplan".
// Each segment becomes a tree level; the display label is just the last segment.
function buildGroupTree(groupFacilities: Facility[]): TreeNode[] {
  // Shorter names = higher in the hierarchy; process parents before children
  const sorted = [...groupFacilities].sort((a, b) => a.name.length - b.name.length)
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  for (const f of sorted) {
    const lastComma = f.name.lastIndexOf(',')
    const label = lastComma !== -1 ? f.name.slice(lastComma + 1).trim() : f.name
    const node: TreeNode = { id: f.id, label, children: [], allIds: [f.id] }
    nodeMap.set(f.name, node)

    if (lastComma !== -1) {
      const parentName = f.name.slice(0, lastComma).trim()
      const parent = nodeMap.get(parentName)
      if (parent) {
        parent.children.push(node)
        continue
      }
    }
    roots.push(node)
  }

  // Propagate descendant ids upward (bottom-up)
  function propagate(node: TreeNode) {
    for (const child of node.children) {
      propagate(child)
      node.allIds.push(...child.allIds)
    }
  }
  roots.forEach(propagate)

  return roots
}

type CheckState = 'checked' | 'mixed' | 'unchecked'

function checkState(allIds: number[], selected: Set<number>): CheckState {
  const n = allIds.filter(id => selected.has(id)).length
  if (n === 0) return 'unchecked'
  if (n === allIds.length) return 'checked'
  return 'mixed'
}

function NodeBox({ state, onClick }: { state: CheckState; onClick: () => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={state === 'checked' ? true : state === 'mixed' ? 'mixed' : false}
      onClick={onClick}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-[11px] font-bold shrink-0
        ${state === 'checked'
          ? 'bg-blue-600 border-blue-600 text-white'
          : state === 'mixed'
            ? 'bg-blue-100 border-blue-400 text-blue-600'
            : 'border-gray-300'
        }`}
    >
      {state === 'checked' ? '✓' : state === 'mixed' ? '–' : ''}
    </button>
  )
}

export function FacilityPicker({ open, selected, facilities, onChange, onClose }: FacilityPickerProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected])
  const groups = useMemo(() => [...new Set(facilities.map(f => f.group))], [facilities])

  const treeByGroup = useMemo(() => {
    const map: Record<string, TreeNode[]> = {}
    for (const group of groups) {
      map[group] = buildGroupTree(facilities.filter(f => f.group === group))
    }
    return map
  }, [facilities, groups])

  const idsByGroup = useMemo(() => {
    const map: Record<string, number[]> = {}
    for (const group of groups) {
      map[group] = facilities.filter(f => f.group === group).map(f => f.id)
    }
    return map
  }, [facilities, groups])

  // Auto-expand groups that already have selected items
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const f of facilities) {
      if (selected.includes(f.id)) s.add(f.group)
    }
    return s
  })
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set())

  function collectNodeIds(node: TreeNode): number[] {
    return [node.id, ...node.children.flatMap(collectNodeIds)]
  }

  function toggleExpGroup(group: string) {
    const expanding = !expandedGroups.has(group)
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (expanding) next.add(group); else next.delete(group)
      return next
    })
    if (expanding) {
      // Also expand all nodes within this group
      const allNodeIds = (treeByGroup[group] ?? []).flatMap(collectNodeIds)
      setExpandedNodes(prev => {
        const next = new Set(prev)
        for (const id of allNodeIds) next.add(id)
        return next
      })
    }
  }

  function toggleExpNode(node: TreeNode) {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(node.id)) {
        next.delete(node.id)
      } else {
        for (const id of collectNodeIds(node)) next.add(id)
      }
      return next
    })
  }

  function toggleGroup(group: string) {
    const ids = idsByGroup[group] ?? []
    const state = checkState(ids, selectedSet)
    if (state === 'checked') {
      const next = selected.filter(id => !ids.includes(id))
      if (next.length === 0) return
      onChange(next)
    } else {
      onChange([...new Set([...selected, ...ids])])
    }
  }

  function toggleNode(node: TreeNode) {
    if (selectedSet.has(node.id)) {
      const next = selected.filter(id => id !== node.id)
      if (next.length === 0) return
      onChange(next)
    } else {
      onChange([...selected, node.id])
    }
  }

  function renderNode(node: TreeNode, depth: number): React.ReactNode {
    const state: CheckState = selectedSet.has(node.id) ? 'checked' : 'unchecked'
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0
    // depth 0 → 20px, depth 1 → 36px, depth 2 → 52px …
    const paddingLeft = 20 + depth * 16

    return (
      <div key={node.id}>
        <div className="flex items-center gap-1.5 py-1.5 pr-4" style={{ paddingLeft }}>
          {hasChildren ? (
            <button
              onClick={() => toggleExpNode(node)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 shrink-0 text-sm"
              aria-label={isExpanded ? 'Dölj' : 'Expandera'}
            >
              {isExpanded ? '▾' : '▸'}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <NodeBox state={state} onClick={() => toggleNode(node)} />
          <span
            className="text-sm text-gray-700 cursor-pointer select-none flex-1"
            onClick={() => toggleNode(node)}
          >
            {node.label}
          </span>
        </div>
        {hasChildren && isExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-white focus:outline-none md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-sm md:max-h-[80vh] md:rounded-2xl"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-bold text-gray-900">Välj anläggning</Dialog.Title>
            <Dialog.Close className="text-gray-500 text-2xl leading-none px-2" aria-label="Stäng">✕</Dialog.Close>
          </div>

          {/* Scrollable tree */}
          <div className="flex-1 overflow-y-auto">
            {groups.map(group => {
              const ids = idsByGroup[group] ?? []
              const state = checkState(ids, selectedSet)
              const isExpanded = expandedGroups.has(group)
              const tree = treeByGroup[group] ?? []

              const selectedCount = ids.filter(id => selectedSet.has(id)).length

              return (
                <div key={group} className="border-b border-gray-100 last:border-0">
                  {/* Group header */}
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      onClick={() => toggleExpGroup(group)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 shrink-0 text-base"
                      aria-label={isExpanded ? 'Dölj grupp' : 'Expandera grupp'}
                    >
                      {isExpanded ? '▾' : '▸'}
                    </button>
                    <NodeBox state={state} onClick={() => toggleGroup(group)} />
                    <span
                      className="font-semibold text-gray-800 text-sm cursor-pointer select-none flex-1"
                      onClick={() => toggleExpGroup(group)}
                    >
                      {group}
                    </span>
                    {!isExpanded && selectedCount > 0 && (
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 shrink-0">
                        {selectedCount}
                      </span>
                    )}
                  </div>

                  {/* Tree nodes */}
                  {isExpanded && (
                    <div className="pb-1">
                      {tree.map(node => renderNode(node, 0))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={() => onChange([])}
              disabled={selected.length === 0}
              className="flex-1 border border-gray-200 text-gray-600 font-semibold py-3 rounded-xl active:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Rensa urval
            </button>
            <Dialog.Close className="flex-[2] bg-blue-600 text-white font-semibold py-3 rounded-xl active:bg-blue-700">
              Visa {selected.length > 0
                ? `${selected.length} anläggning${selected.length !== 1 ? 'ar' : ''}`
                : 'tider'}
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

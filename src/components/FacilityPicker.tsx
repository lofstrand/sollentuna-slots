import * as Dialog from '@radix-ui/react-dialog'
import * as Checkbox from '@radix-ui/react-checkbox'
import type { Facility } from '../types'

interface FacilityPickerProps {
  open: boolean
  selected: number[]
  facilities: Facility[]
  onChange: (ids: number[]) => void
  onClose: () => void
}

export function FacilityPicker({ open, selected, facilities, onChange, onClose }: FacilityPickerProps) {
  const groups = [...new Set(facilities.map(f => f.group))]

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  }

  function toggleGroup(group: string) {
    const ids = facilities.filter(f => f.group === group).map(f => f.id)
    const allSelected = ids.every(id => selected.includes(id))
    onChange(allSelected
      ? selected.filter(id => !ids.includes(id))
      : [...new Set([...selected, ...ids])]
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col bg-white focus:outline-none"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-bold text-gray-900">Välj anläggning</Dialog.Title>
            <Dialog.Close className="text-gray-500 text-2xl leading-none px-2" aria-label="Stäng">
              ✕
            </Dialog.Close>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
            {groups.map(group => {
              const groupFacilities = facilities.filter(f => f.group === group)
              const allSelected = groupFacilities.every(f => selected.includes(f.id))
              const someSelected = groupFacilities.some(f => selected.includes(f.id))

              return (
                <div key={group}>
                  {/* Group row */}
                  <button
                    onClick={() => toggleGroup(group)}
                    className="flex items-center gap-2.5 mb-2 w-full text-left"
                  >
                    <GroupCheckbox checked={allSelected} indeterminate={!allSelected && someSelected} />
                    <span className="font-semibold text-gray-700 text-sm">{group}</span>
                  </button>

                  {/* Facility checkboxes */}
                  <div className="space-y-1 pl-1">
                    {groupFacilities.map(f => (
                      <label key={f.id} className="flex items-center gap-3 py-1.5 cursor-pointer">
                        <Checkbox.Root
                          checked={selected.includes(f.id)}
                          onCheckedChange={() => toggle(f.id)}
                          className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center shrink-0
                            data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600
                            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                        >
                          <Checkbox.Indicator className="text-white text-xs font-bold">✓</Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="text-gray-700 text-sm">{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <Dialog.Close className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl active:bg-blue-700">
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

// Group-level checkbox: supports indeterminate state
function GroupCheckbox({ checked, indeterminate }: { checked: boolean; indeterminate: boolean }) {
  return (
    <span
      className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold shrink-0
        ${checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : indeterminate
            ? 'bg-blue-100 border-blue-400 text-blue-600'
            : 'border-gray-300 text-transparent'
        }`}
    >
      {checked ? '✓' : indeterminate ? '–' : ''}
    </span>
  )
}

import type { Facility, InterbookResponse, SelectedSlot } from '../types'
import { computeFreeSlots, toDateString, stripHtml, timeToMin } from '../lib/schedule'
import { SlotRow } from './SlotRow'

interface FacilitySlotsProps {
  facility: Facility
  data: InterbookResponse | undefined
  isLoading: boolean
  isError: boolean
  date: Date
  minDuration: number
  showBooked: boolean
  onBook: (slot: SelectedSlot) => void
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded bg-gray-100 animate-pulse">
      <div className="w-4 h-4 rounded-full bg-gray-300" />
      <div className="flex-1 h-4 rounded bg-gray-300" />
    </div>
  )
}

export function FacilitySlots({
  facility,
  data,
  isLoading,
  isError,
  date,
  minDuration,
  showBooked,
  onBook,
}: FacilitySlotsProps) {
  const dateStr = toDateString(date)

  if (isLoading) {
    return (
      <div className="space-y-1.5 mb-2">
        <p className="text-xs font-semibold text-gray-500 px-1">{facility.name}</p>
        <SkeletonRow />
        <SkeletonRow />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-500 px-1">{facility.name}</p>
        <p className="text-xs text-red-500 px-3 py-2 bg-red-50 rounded">
          Kunde inte hämta data
        </p>
      </div>
    )
  }

  const freeSlots = computeFreeSlots(data.events, dateStr, minDuration)
  const dayEvents = data.events.filter(e => e.start.startsWith(dateStr))

  type RowEntry = {
    key: string
    type: 'free' | 'training' | 'match'
    startMin: number
    endMin: number
    description?: string
  }

  const entries: RowEntry[] = []

  freeSlots.forEach((slot, i) => {
    entries.push({ key: `free-${i}`, type: 'free', startMin: slot.startMin, endMin: slot.endMin })
  })

  if (showBooked) {
    dayEvents
      .filter(e => e.type === 'normal' && e.status === 'booked')
      .forEach((e, i) => {
        entries.push({
          key: `train-${i}`,
          type: 'training',
          startMin: timeToMin(e.start.slice(11, 16)),
          endMin: timeToMin(e.end.slice(11, 16)),
          description: stripHtml(e.description),
        })
      })

    dayEvents
      .filter(e => e.type === 'match')
      .forEach((e, i) => {
        entries.push({
          key: `match-${i}`,
          type: 'match',
          startMin: timeToMin(e.start.slice(11, 16)),
          endMin: timeToMin(e.end.slice(11, 16)),
          description: stripHtml(e.description),
        })
      })
  }

  entries.sort((a, b) => a.startMin - b.startMin)

  if (entries.length === 0) {
    return (
      <div className="mb-2">
        <p className="text-xs font-semibold text-gray-500 px-1 mb-1">{facility.name}</p>
        <p className="text-xs text-gray-400 italic px-3 py-1">Inga tider</p>
      </div>
    )
  }

  const rows = entries.map(entry => (
    <SlotRow
      key={entry.key}
      type={entry.type}
      startMin={entry.startMin}
      endMin={entry.endMin}
      description={entry.description}
      onBook={
        entry.type === 'free'
          ? () => onBook({
              facilityId: facility.id,
              facilityName: facility.name,
              date: dateStr,
              startMin: entry.startMin,
              endMin: entry.endMin,
            })
          : undefined
      }
    />
  ))

  return (
    <div className="mb-2">
      <p className="text-xs font-semibold text-gray-500 px-1 mb-1">{facility.name}</p>
      <div className="space-y-1">{rows}</div>
    </div>
  )
}

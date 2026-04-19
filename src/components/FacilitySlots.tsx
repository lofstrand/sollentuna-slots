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
  showEmpty: boolean
  onBook: (slot: SelectedSlot) => void
}

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-[0px_8px_16px_rgba(0,0,0,0.02)] border-l-4 border-surface-container-high">
      <div className="skeleton h-5 w-32 rounded-md mb-1" />
      <div className="skeleton h-4 w-24 rounded-md mb-3" />
      <div className="skeleton h-4 w-28 rounded-md mb-2" />
      <div className="skeleton h-4 w-28 rounded-md mb-3" />
      <div className="skeleton h-10 w-full rounded-lg" />
    </div>
  )
}

function facilityDisplayName(facility: Facility): string {
  const lastComma = facility.name.lastIndexOf(',')
  const leaf = lastComma !== -1 ? facility.name.slice(lastComma + 1).trim() : facility.name
  return `${facility.group}, ${leaf}`
}

function facilityFieldName(facility: Facility): string {
  const lastComma = facility.name.lastIndexOf(',')
  return lastComma !== -1 ? facility.name.slice(lastComma + 1).trim() : facility.name
}

export function FacilitySlots({
  facility,
  data,
  isLoading,
  isError,
  date,
  minDuration,
  showBooked,
  showEmpty,
  onBook,
}: FacilitySlotsProps) {
  const dateStr = toDateString(date)
  const displayName = facilityDisplayName(facility)

  if (isLoading) {
    return <SkeletonCard />
  }

  if (isError || !data) {
    return (
      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 opacity-75">
        <h3 className="font-display font-semibold text-lg text-on-surface-variant">{facility.group}</h3>
        <p className="text-on-surface-variant/70 text-sm font-body mt-0.5">{facilityFieldName(facility)}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="material-symbols-outlined text-tertiary text-sm">error</span>
          <span className="text-tertiary font-bold text-xs uppercase tracking-wider font-body">Kunde inte hämta data</span>
        </div>
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
    if (!showEmpty) return null
    return (
      <div className="bg-surface-container-low rounded-xl p-5 border border-outline-variant/20 opacity-75">
        <h3 className="font-display font-semibold text-lg text-on-surface-variant">{facility.group}</h3>
        <p className="text-on-surface-variant/70 text-sm font-body mt-0.5">{facilityFieldName(facility)}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="material-symbols-outlined text-on-surface-variant text-sm">block</span>
          <span className="text-tertiary font-bold text-xs uppercase tracking-wider font-body">Fullbokad</span>
        </div>
      </div>
    )
  }

  const hasFree = freeSlots.length > 0

  function handleBook() {
    const first = freeSlots[0]
    onBook({
      facilityId: facility.id,
      facilityName: displayName,
      date: dateStr,
      startMin: first.startMin,
      endMin: first.endMin,
      availableSlots: freeSlots.map(s => ({ startMin: s.startMin, endMin: s.endMin })),
    })
  }

  return (
    <div className={`rounded-xl p-5 shadow-[0px_12px_24px_rgba(0,0,0,0.04)] ${
      hasFree
        ? 'bg-surface-container-lowest border-l-4 border-primary'
        : 'bg-surface-container-low border border-outline-variant/20 opacity-75'
    }`}>
      {/* Facility header */}
      <h3 className="font-display font-bold text-lg text-on-surface">{facility.group}</h3>
      <p className="text-on-surface-variant text-sm font-body mt-0.5">{facilityFieldName(facility)}</p>

      {/* Slot rows */}
      <div className="mt-2 divide-y divide-outline-variant/10">
        {entries.map(entry => (
          <SlotRow
            key={entry.key}
            type={entry.type}
            startMin={entry.startMin}
            endMin={entry.endMin}
            description={entry.description}
          />
        ))}
      </div>

      {/* Single book button */}
      {hasFree && (
        <button
          onClick={handleBook}
          className="w-full mt-3 bg-gradient-to-b from-primary to-primary-container text-white py-3 rounded-xl font-display font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Skicka förfrågan
        </button>
      )}
    </div>
  )
}

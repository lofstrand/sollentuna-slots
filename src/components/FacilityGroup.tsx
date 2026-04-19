import * as Popover from '@radix-ui/react-popover'
import type { Facility, FacilityQuery, SelectedSlot, InterbookEvent } from '../types'
import { computeFreeSlots, toDateString, minToTime, timeToMin, stripHtml } from '../lib/schedule'

interface FacilityGroupProps {
  groupName: string
  facilities: Facility[]
  queriesByFacilityId: Record<number, FacilityQuery>
  date: Date
  minDuration: number
  showBooked: boolean
  showEmpty: boolean
  onBook: (slot: SelectedSlot) => void
}

function facilityFieldName(facility: Facility): string {
  const lastComma = facility.name.lastIndexOf(',')
  return lastComma !== -1 ? facility.name.slice(lastComma + 1).trim() : facility.name
}

function getBookedEvents(events: InterbookEvent[], dateStr: string): InterbookEvent[] {
  return events.filter(e => {
    if (!e.start.startsWith(dateStr)) return false
    return (e.type === 'normal' && e.status === 'booked') || e.type === 'match'
  })
}

export function FacilityGroup({
  groupName,
  facilities,
  queriesByFacilityId,
  date,
  minDuration,
  showBooked,
  showEmpty,
  onBook,
}: FacilityGroupProps) {
  const dateStr = toDateString(date)

  const rows = facilities.map(facility => {
    const q = queriesByFacilityId[facility.id]
    const isLoading = q?.isLoading ?? false
    const freeSlots = q?.data ? computeFreeSlots(q.data.events, dateStr, minDuration) : []
    const bookedEvents = showBooked && q?.data ? getBookedEvents(q.data.events, dateStr) : []
    return { facility, isLoading, freeSlots, bookedEvents }
  })

  const anyLoading = rows.some(r => r.isLoading)
  const totalFree = rows.reduce((n, r) => n + r.freeSlots.length, 0)
  const anyFree = totalFree > 0

  if (!anyFree && !anyLoading && !showEmpty) return null

  return (
    <div className={`rounded-xl overflow-hidden bg-surface-container-lowest shadow-[0px_4px_16px_rgba(0,0,0,0.04)] border-l-4 ${
      anyFree ? 'border-primary' : 'border-surface-container-high'
    }`}>

      {/* Group header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/10">
        <h3 className="font-display font-bold text-base text-on-surface">{groupName}</h3>
        {anyLoading ? (
          <span className="text-label-sm text-on-surface-variant font-body">Laddar…</span>
        ) : anyFree ? (
          <span className="text-label-sm font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5 font-body">
            {totalFree} {totalFree === 1 ? 'ledig' : 'lediga'}
          </span>
        ) : (
          <span className="text-label-sm font-bold text-tertiary font-body uppercase tracking-wide">
            Fullbokad
          </span>
        )}
      </div>

      {/* Sub-facility rows */}
      <div className="divide-y divide-outline-variant/10">
        {rows.map(({ facility, isLoading, freeSlots, bookedEvents }) => {
          const fieldName = facilityFieldName(facility)
          const hasFree = freeSlots.length > 0
          const hasBooked = bookedEvents.length > 0

          if (!hasFree && !hasBooked && !showEmpty && !isLoading) return null

          return (
            <div
              key={facility.id}
              className={`px-4 py-3 ${!hasFree && !isLoading ? 'opacity-40' : ''}`}
            >
              <p className="text-xs font-semibold font-body uppercase tracking-wider text-on-surface-variant mb-2">
                {fieldName}
              </p>

              {isLoading ? (
                <div className="flex gap-2">
                  <div className="skeleton h-7 w-28 rounded-full" />
                  <div className="skeleton h-7 w-28 rounded-full" />
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {[
                    ...freeSlots.map(slot => ({ kind: 'free' as const, startMin: slot.startMin, endMin: slot.endMin, slot })),
                    ...bookedEvents.map(event => ({ kind: 'booked' as const, startMin: timeToMin(event.start.slice(11, 16)), endMin: timeToMin(event.end.slice(11, 16)), event })),
                  ].sort((a, b) => a.startMin - b.startMin).map((item, i) => {
                    if (item.kind === 'free') {
                      return (
                        <button
                          key={i}
                          onClick={() => onBook({
                            facilityId: facility.id,
                            facilityName: `${groupName}, ${fieldName}`,
                            date: dateStr,
                            startMin: item.slot.startMin,
                            endMin: item.slot.endMin,
                            availableSlots: [item.slot, ...freeSlots.filter(s => s !== item.slot)],
                          })}
                          aria-label={`Boka ${fieldName}, ${minToTime(item.startMin)}–${minToTime(item.endMin)}`}
                          className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1.5 text-sm font-semibold font-body active:bg-primary/20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm leading-none shrink-0">schedule</span>
                          {minToTime(item.startMin)}–{minToTime(item.endMin)}
                        </button>
                      )
                    }
                    const icon = item.event.type === 'match' ? 'scoreboard' : 'sports_soccer'
                    const description = stripHtml(item.event.description).trim()
                    return (
                      <Popover.Root key={i}>
                        <Popover.Trigger asChild>
                          <button className="flex items-center gap-1.5 bg-surface-container text-on-surface-variant rounded-full px-3 py-1.5 text-sm font-body opacity-70 active:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-sm leading-none shrink-0">{icon}</span>
                            {minToTime(item.startMin)}–{minToTime(item.endMin)}
                          </button>
                        </Popover.Trigger>
                        {description && (
                          <Popover.Portal>
                            <Popover.Content
                              sideOffset={6}
                              className="z-50 max-w-56 bg-surface-container-lowest rounded-xl shadow-ambient-lg px-3 py-2.5 text-label-sm font-body text-on-surface focus:outline-none"
                            >
                              {description}
                              <Popover.Arrow className="fill-surface-container-lowest" />
                            </Popover.Content>
                          </Popover.Portal>
                        )}
                      </Popover.Root>
                    )
                  })}
                  {!hasFree && !hasBooked && (
                    <p className="text-xs font-semibold font-body text-tertiary">Fullbokad</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

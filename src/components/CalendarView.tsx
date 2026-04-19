import { useState, useMemo } from 'react'
import * as Popover from '@radix-ui/react-popover'

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']
import type { Facility, FacilityQuery, SelectedSlot } from '../types'
import {
  getMonthDates,
  getToday,
  isPast,
  formatDayLabel,
  formatMonthLabel,
  toDateString,
  computeFreeSlots,
} from '../lib/schedule'
import { FacilityGroup } from './FacilityGroup'

interface CalendarViewProps {
  queries: FacilityQuery[]
  facilityIds: number[]
  facilities: Facility[]
  viewDate: Date        // any date in the target month
  minDuration: number
  showBooked: boolean
  showEmpty: boolean
  onBook: (slot: SelectedSlot) => void
  onNavigate: (direction: -1 | 1) => void
  onViewDateChange: (date: Date) => void
}


const DAY_HEADERS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

// Mon=0 … Sun=6
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

type Availability = 'free' | 'busy' | 'empty' | 'loading'

function getDayAvailability(
  facilityIds: number[],
  queriesByFacilityId: Record<number, FacilityQuery>,
  dateStr: string,
  minDuration: number,
): Availability {
  if (facilityIds.some(id => queriesByFacilityId[id]?.isLoading)) return 'loading'
  const hasFree = facilityIds.some(id => {
    const q = queriesByFacilityId[id]
    if (!q?.data) return false
    return computeFreeSlots(q.data.events, dateStr, minDuration).length > 0
  })
  if (hasFree) return 'free'
  return facilityIds.some(id => queriesByFacilityId[id]?.data) ? 'busy' : 'empty'
}

export function CalendarView({
  queries,
  facilityIds,
  facilities,
  viewDate,
  minDuration,
  showBooked,
  showEmpty,
  onBook,
  onNavigate,
  onViewDateChange,
}: CalendarViewProps) {
  const [pickerYear, setPickerYear] = useState(viewDate.getFullYear())

  // Pre-select today if the initial view is the current month
  const [selectedDate_, setSelectedDate] = useState<Date | null>(() => {
    const today = getToday()
    return today.getFullYear() === viewDate.getFullYear() &&
      today.getMonth() === viewDate.getMonth()
      ? today
      : null
  })

  // Ignore selectedDate if it belongs to a different month than viewDate
  const selectedDate = selectedDate_ &&
    selectedDate_.getFullYear() === viewDate.getFullYear() &&
    selectedDate_.getMonth() === viewDate.getMonth()
    ? selectedDate_ : null

  const queriesByFacilityId = useMemo(
    () => Object.fromEntries(facilityIds.map((id, i) => [id, queries[i]])),
    [facilityIds, queries],
  )
  const visibleFacilities = useMemo(
    () => facilities.filter(f => facilityIds.includes(f.id)),
    [facilities, facilityIds],
  )

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthDates = getMonthDates(year, month)

  const availabilityMap = useMemo(() => {
    const map: Record<string, Availability> = {}
    for (const date of monthDates) {
      const dateStr = toDateString(date)
      map[dateStr] = getDayAvailability(facilityIds, queriesByFacilityId, dateStr, minDuration)
    }
    return map
  }, [facilityIds, queriesByFacilityId, monthDates, minDuration])

  // Build grid rows: pad start with nulls so the 1st lands on the right weekday
  const leadingNulls = mondayIndex(monthDates[0]!)
  const cells: (Date | null)[] = [
    ...Array<null>(leadingNulls).fill(null),
    ...monthDates,
  ]
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const todayStr = toDateString(new Date())
  const selectedDateStr = selectedDate ? toDateString(selectedDate) : null

  if (facilityIds.length === 0) {
    return (
      <p className="text-center text-on-surface-variant mt-16 px-6 font-body">
        Välj minst en anläggning för att se lediga tider.
      </p>
    )
  }

  return (
    <div className="px-3 pt-3 pb-16 lg:pb-6 lg:grid lg:grid-cols-[1fr_320px] lg:gap-4 lg:items-start">
      {/* Calendar grid */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/40 overflow-hidden mb-4 lg:mb-0 lg:order-last">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <button
            onClick={() => onNavigate(-1)}
            className="w-8 h-8 rounded-md bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-high text-lg font-display"
            aria-label="Föregående månad"
          >‹</button>
          <Popover.Root onOpenChange={open => { if (open) setPickerYear(viewDate.getFullYear()) }}>
            <Popover.Trigger className="text-label-lg font-display text-on-surface px-3 py-1.5 rounded-md hover:bg-surface-container active:bg-surface-container-high transition-colors capitalize">
              {formatMonthLabel(viewDate)}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={6}
                className="z-50 w-56 bg-surface-container-lowest rounded-xl shadow-ambient-lg p-3 focus:outline-none"
              >
                {/* Year navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setPickerYear(y => y - 1)}
                    className="w-8 h-8 rounded-md bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high text-lg leading-none font-display"
                  >‹</button>
                  <span className="text-label-lg font-display text-on-surface">{pickerYear}</span>
                  <button
                    onClick={() => setPickerYear(y => y + 1)}
                    className="w-8 h-8 rounded-md bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high text-lg leading-none font-display"
                  >›</button>
                </div>
                {/* Month grid */}
                <Popover.Close asChild>
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS_SHORT.map((name, mi) => {
                      const isCurrent = pickerYear === viewDate.getFullYear() && mi === viewDate.getMonth()
                      return (
                        <button
                          key={mi}
                          onClick={() => onViewDateChange(new Date(pickerYear, mi, 1))}
                          className={`py-1.5 rounded-md text-label-md font-body font-semibold transition-colors
                            ${isCurrent ? 'bg-gradient-to-b from-primary to-primary-container text-white' : 'text-on-surface hover:bg-surface-container active:bg-surface-container-high'}
                          `}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </Popover.Close>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div className="flex gap-1">
            <button
              onClick={() => onNavigate(1)}
              className="w-8 h-8 rounded-md bg-surface-container text-on-surface flex items-center justify-center hover:bg-surface-container-high active:bg-surface-container-high text-lg font-display"
              aria-label="Nästa månad"
            >›</button>
            <button
              onClick={() => { onViewDateChange(getToday()); setSelectedDate(getToday()) }}
              className="text-label-sm font-semibold px-3 py-1.5 rounded-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-high font-body"
            >
              Idag
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-surface-container-low">
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-label-sm font-body text-on-surface-variant">{d}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date, di) => {
              if (!date) return <div key={di} className="py-3" />

              const dateStr    = toDateString(date)
              const isToday    = dateStr === todayStr
              const past       = isPast(date)
              const isSelected = dateStr === selectedDateStr
              const avail      = availabilityMap[dateStr] ?? 'empty'

              const availLabel =
                avail === 'free' ? 'lediga tider' :
                avail === 'busy' ? 'inga lediga tider' :
                avail === 'loading' ? 'laddar' : ''

              return (
                <button
                  key={di}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  disabled={past}
                  aria-label={`${formatDayLabel(date)}${availLabel ? `, ${availLabel}` : ''}`}
                  className={`flex flex-col items-center py-3 transition-colors
                    ${past ? 'opacity-25 cursor-default' :
                      isSelected ? 'bg-primary/15' :
                      avail === 'free' ? 'bg-primary/[0.06] active:bg-primary/10' :
                      avail === 'busy' ? 'bg-tertiary/[0.05] active:bg-surface-container-low' :
                      'active:bg-surface-container-low'
                    }
                  `}
                >
                  <span className={`text-label-lg font-body w-8 h-8 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-gradient-to-b from-primary to-primary-container text-white' :
                      isSelected ? 'bg-primary/25 text-primary font-bold ring-2 ring-primary/30' :
                      !past && avail === 'free' ? 'text-primary font-semibold' :
                      'text-on-surface'
                    }
                  `}>
                    {date.getDate()}
                  </span>
                  {avail === 'loading' && !past && (
                    <div className="mt-1 h-1 w-5 rounded-full bg-surface-container-high animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>
        ))}

      </div>

      {/* Day detail panel */}
      <div className={`${selectedDate ? '' : 'hidden lg:flex lg:items-center lg:justify-center lg:min-h-48 bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/40'}`}>
        {selectedDate ? (
          <>
            <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-display text-headline-lg text-on-surface capitalize">
                  {formatDayLabel(selectedDate)}
                </h2>
                {(() => {
                  const dateStr = toDateString(selectedDate)
                  let freeCount = 0
                  for (const id of facilityIds) {
                    const q = queriesByFacilityId[id]
                    if (q?.data) freeCount += computeFreeSlots(q.data.events, dateStr, minDuration).length
                  }
                  const isLoading = facilityIds.some(id => queriesByFacilityId[id]?.isLoading)
                  return (
                    <span className={`text-label-sm font-semibold font-body uppercase tracking-wider mt-1 block ${
                      isLoading ? 'text-on-surface-variant' : freeCount > 0 ? 'text-primary' : 'text-tertiary'
                    }`}>
                      {isLoading ? 'Hämtar tider…' : freeCount > 0 ? `${freeCount} lediga tider` : 'Inga lediga tider'}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-on-surface-variant text-lg px-1 hover:text-on-surface mt-1"
                aria-label="Stäng"
              >
                ✕
              </button>
            </div>
            {(() => {
              const groupMap = new Map<string, typeof visibleFacilities>()
              for (const facility of visibleFacilities) {
                const list = groupMap.get(facility.group) ?? []
                groupMap.set(facility.group, [...list, facility])
              }
              return (
                <div className="px-3 py-3 grid gap-4">
                  {[...groupMap.entries()].map(([groupName, groupFacilities]) => (
                    <FacilityGroup
                      key={groupName}
                      groupName={groupName}
                      facilities={groupFacilities}
                      queriesByFacilityId={queriesByFacilityId}
                      date={selectedDate}
                      minDuration={minDuration}
                      showBooked={showBooked}
                      showEmpty={showEmpty}
                      onBook={onBook}
                    />
                  ))}
                </div>
              )
            })()}
          </>
        ) : (
          <p className="text-label-md text-on-surface-variant px-6 text-center font-body">Välj ett datum för att se lediga tider.</p>
        )}
      </div>
    </div>
  )
}

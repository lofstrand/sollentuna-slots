import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { DayFilter, Facility, InterbookResponse, SelectedSlot } from '../types'
import {
  getMonthDates,
  isVisibleDay,
  isPast,
  formatDayLabel,
  toDateString,
  computeFreeSlots,
} from '../lib/schedule'
import { FacilitySlots } from './FacilitySlots'

interface CalendarViewProps {
  queries: UseQueryResult<InterbookResponse>[]
  facilityIds: number[]
  facilities: Facility[]
  viewDate: Date        // any date in the target month
  dayFilter: DayFilter
  minDuration: number
  showBooked: boolean
  onBook: (slot: SelectedSlot) => void
}

const DAY_HEADERS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

// Mon=0 … Sun=6
function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

type Availability = 'free' | 'busy' | 'empty' | 'loading'

function getDayAvailability(
  facilityIds: number[],
  queriesByFacilityId: Record<number, UseQueryResult<InterbookResponse>>,
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
  dayFilter,
  minDuration,
  showBooked,
  onBook,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const queriesByFacilityId = Object.fromEntries(
    facilityIds.map((id, i) => [id, queries[i]!]),
  )
  const visibleFacilities = facilities.filter(f => facilityIds.includes(f.id))

  const year  = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthDates = getMonthDates(year, month)

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
      <p className="text-center text-gray-400 mt-16 px-6">
        Välj minst en anläggning för att se lediga tider.
      </p>
    )
  }

  return (
    <div className="px-3 pt-2 pb-24">
      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAY_HEADERS.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400">{d}</div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className={`grid grid-cols-7 ${wi < weeks.length - 1 ? 'border-b border-gray-100' : ''}`}>
            {week.map((date, di) => {
              if (!date) return <div key={di} className="py-3" />

              const dateStr    = toDateString(date)
              const isToday    = dateStr === todayStr
              const past       = isPast(date)
              const isVisible  = isVisibleDay(date, dayFilter)
              const isSelected = dateStr === selectedDateStr
              const avail      = getDayAvailability(facilityIds, queriesByFacilityId, dateStr, minDuration)

              return (
                <button
                  key={di}
                  onClick={() => setSelectedDate(isSelected ? null : date)}
                  disabled={past || !isVisible}
                  className={`flex flex-col items-center py-2 transition-colors
                    ${isSelected ? 'bg-blue-50' : 'active:bg-gray-50'}
                    ${past || !isVisible ? 'opacity-25 cursor-default' : ''}
                    ${di < 6 ? 'border-r border-gray-50' : ''}
                  `}
                >
                  <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-600 text-white' : isSelected ? 'text-blue-700' : 'text-gray-800'}
                  `}>
                    {date.getDate()}
                  </span>
                  <div className="mt-0.5 h-1.5 w-1.5 rounded-full">
                    {avail === 'loading' && <div className="h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse" />}
                    {avail === 'free'    && <div className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                    {avail === 'busy'    && <div className="h-1.5 w-1.5 rounded-full bg-red-300" />}
                  </div>
                </button>
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500">Ledig tid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-300" />
            <span className="text-xs text-gray-500">Inga lediga tider</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-500">Laddar</span>
          </div>
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && isVisibleDay(selectedDate, dayFilter) && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 capitalize">
              {formatDayLabel(selectedDate)}
            </h2>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 text-lg px-1"
              aria-label="Stäng"
            >
              ✕
            </button>
          </div>
          <div className="px-3 py-3 space-y-1">
            {visibleFacilities.map(facility => (
              <FacilitySlots
                key={facility.id}
                facility={facility}
                data={queriesByFacilityId[facility.id]?.data}
                isLoading={queriesByFacilityId[facility.id]?.isLoading ?? false}
                isError={queriesByFacilityId[facility.id]?.isError ?? false}
                date={selectedDate}
                minDuration={minDuration}
                showBooked={showBooked}
                onBook={onBook}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

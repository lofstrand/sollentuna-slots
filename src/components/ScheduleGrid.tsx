import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Popover from '@radix-ui/react-popover'
import type { DayFilter, Facility, FacilityQuery, SelectedSlot } from '../types'
import { getWindowDates, isVisibleDay, isPast, formatListRangeLabel, toDateString, getToday } from '../lib/schedule'
import { FETCH_DAYS } from '../constants'
import { DaySection } from './DaySection'

interface ScheduleGridProps {
  queries: FacilityQuery[]
  facilityIds: number[]
  facilities: Facility[]
  startDate: Date
  dayFilter: DayFilter
  minDuration: number
  showBooked: boolean
  onBook: (slot: SelectedSlot) => void
  onNavigate: (direction: -1 | 1) => void
  onDayFilterChange: (f: DayFilter) => void
  onViewDateChange: (date: Date) => void
}

export function ScheduleGrid({
  queries,
  facilityIds,
  facilities,
  startDate,
  dayFilter,
  minDuration,
  showBooked,
  onBook,
  onNavigate,
  onDayFilterChange,
  onViewDateChange,
}: ScheduleGridProps) {
  const dates = getWindowDates(startDate).filter(d => isVisibleDay(d, dayFilter) && !isPast(d))

  const queriesByFacilityId = Object.fromEntries(
    facilityIds.map((id, i) => [id, queries[i]]),
  )

  const navLabel = formatListRangeLabel(startDate, FETCH_DAYS)
  const inputValue = toDateString(startDate)

  function handleDateInput(raw: string) {
    if (!raw) return
    const d = new Date(raw + 'T00:00:00')
    if (!isNaN(d.getTime())) onViewDateChange(d)
  }

  if (facilityIds.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-16 px-6">
        Välj minst en anläggning för att se lediga tider.
      </p>
    )
  }

  return (
    <div className="px-3 pt-2 pb-16 lg:pb-6">
      {/* Inline nav row */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => onNavigate(-1)}
          className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200 text-lg"
          aria-label="Föregående period"
        >
          ‹
        </button>

        <Popover.Root>
          <Popover.Trigger className="shrink-0 text-sm font-semibold text-gray-700 min-w-[110px] text-center px-2 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
            {navLabel}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={6}
              className="z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 focus:outline-none"
            >
              <p className="text-xs font-medium text-gray-500 mb-2">Hoppa till datum</p>
              <input
                type="date"
                defaultValue={inputValue}
                key={inputValue}
                onChange={e => handleDateInput(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Popover.Arrow className="fill-white drop-shadow-sm" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <button
          onClick={() => onNavigate(1)}
          className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200 text-lg"
          aria-label="Nästa period"
        >
          ›
        </button>

        <button
          onClick={() => onViewDateChange(getToday())}
          className="shrink-0 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-200"
        >
          Idag
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Day filter */}
        <ToggleGroup.Root
          type="single"
          value={dayFilter}
          onValueChange={v => { if (v) onDayFilterChange(v as DayFilter) }}
          className="flex shrink-0 bg-gray-100 rounded-lg p-0.5 text-xs font-medium"
        >
          <ToggleGroup.Item
            value="fri-sun"
            className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm text-gray-500"
          >
            Fre–Sön
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="all"
            className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm text-gray-500"
          >
            Alla
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
        {dates.map(date => (
          <DaySection
            key={date.toISOString()}
            date={date}
            facilityIds={facilityIds}
            facilities={facilities}
            queriesByFacilityId={queriesByFacilityId}
            minDuration={minDuration}
            showBooked={showBooked}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  )
}

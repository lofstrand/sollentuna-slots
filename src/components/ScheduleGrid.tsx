import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { DayFilter, Facility, FacilityQuery, SelectedSlot } from '../types'
import { getWindowDates, isVisibleDay, isPast, formatListRangeLabel, getToday, getMondayOf } from '../lib/schedule'
import { FETCH_DAYS } from '../constants'
import { DaySection } from './DaySection'
import { DatePickerPopover } from './DatePickerPopover'

interface ScheduleGridProps {
  queries: FacilityQuery[]
  facilityIds: number[]
  facilities: Facility[]
  startDate: Date
  dayFilter: DayFilter
  minDuration: number
  showBooked: boolean
  showEmpty: boolean
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
  showEmpty,
  onBook,
  onNavigate,
  onDayFilterChange,
  onViewDateChange,
}: ScheduleGridProps) {
  const dates = getWindowDates(startDate, FETCH_DAYS).filter(d => isVisibleDay(d, dayFilter) && !isPast(d))
  const queriesByFacilityId = Object.fromEntries(facilityIds.map((id, i) => [id, queries[i]]))
  const navLabel = formatListRangeLabel(startDate, FETCH_DAYS)

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

        <DatePickerPopover
          selected={startDate}
          days={FETCH_DAYS}
          onSelect={d => onViewDateChange(getMondayOf(d))}
          trigger={
            <button className="shrink-0 text-sm font-semibold text-gray-700 min-w-[110px] text-center px-2 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
              {navLabel}
            </button>
          }
        />

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

      <div>
        {dates.map(date => (
          <DaySection
            key={date.toISOString()}
            date={date}
            facilityIds={facilityIds}
            facilities={facilities}
            queriesByFacilityId={queriesByFacilityId}
            minDuration={minDuration}
            showBooked={showBooked}
            showEmpty={showEmpty}
            onBook={onBook}
          />
        ))}
      </div>
    </div>
  )
}

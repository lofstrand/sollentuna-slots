import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { DayFilter, Facility, FacilityQuery, SelectedSlot } from '../types'
import { getWindowDates, isVisibleDay, formatListRangeLabel, getToday, getMondayOf } from '../lib/schedule'
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
  const displayDays = dayFilter === 'fri-sun' ? 7 : FETCH_DAYS
  const dates = getWindowDates(startDate, displayDays).filter(d => isVisibleDay(d, dayFilter))
  const queriesByFacilityId = Object.fromEntries(facilityIds.map((id, i) => [id, queries[i]]))
  const navLabel = formatListRangeLabel(startDate)

  if (facilityIds.length === 0) {
    return (
      <p className="text-center text-on-surface-variant mt-16 px-6 font-body">
        Välj minst en anläggning för att se lediga tider.
      </p>
    )
  }

  return (
    <div className="px-4 pt-3 pb-16 lg:pb-6">
      {/* Inline nav row */}
      <div className="flex items-center gap-2 mb-4">
        {/* Navigation — left */}
        <button
          onClick={() => onNavigate(-1)}
          className="shrink-0 w-9 h-9 rounded-md bg-surface-container text-on-surface flex items-center justify-center active:bg-surface-container-high text-lg font-display"
          aria-label="Föregående period"
        >‹</button>

        <DatePickerPopover
          selected={startDate}
          days={FETCH_DAYS}
          onSelect={d => onViewDateChange(getMondayOf(d))}
          trigger={
            <button className="shrink-0 text-label-lg font-display text-on-surface min-w-[72px] text-center px-2 py-1.5 rounded-md hover:bg-surface-container active:bg-surface-container-high transition-colors">
              {navLabel}
            </button>
          }
        />

        <button
          onClick={() => onNavigate(1)}
          className="shrink-0 w-9 h-9 rounded-md bg-surface-container text-on-surface flex items-center justify-center active:bg-surface-container-high text-lg font-display"
          aria-label="Nästa period"
        >›</button>

        <button
          onClick={() => onViewDateChange(getToday())}
          className="shrink-0 text-label-sm font-semibold px-3 py-2 rounded-md bg-surface-container text-on-surface-variant hover:bg-surface-container-high active:bg-surface-container-high font-body"
        >
          Idag
        </button>

        {/* Day filter — right */}
        <ToggleGroup.Root
          type="single"
          value={dayFilter}
          onValueChange={v => { if (v) onDayFilterChange(v as DayFilter) }}
          className="flex shrink-0 bg-surface-container rounded-md p-0.5 text-label-sm font-semibold font-body ml-auto"
        >
          <ToggleGroup.Item
            value="fri-sun"
            className="px-3 py-1.5 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:text-on-surface data-[state=on]:shadow-ambient text-on-surface-variant"
          >
            Fre–Sön
          </ToggleGroup.Item>
          <ToggleGroup.Item
            value="all"
            className="px-3 py-1.5 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:text-on-surface data-[state=on]:shadow-ambient text-on-surface-variant"
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

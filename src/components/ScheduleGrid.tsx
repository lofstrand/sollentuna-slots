import type { UseQueryResult } from '@tanstack/react-query'
import type { DayFilter, Facility, InterbookResponse, SelectedSlot } from '../types'
import { getWindowDates, isVisibleDay, isPast } from '../lib/schedule'
import { DaySection } from './DaySection'

interface ScheduleGridProps {
  queries: UseQueryResult<InterbookResponse>[]
  facilityIds: number[]
  facilities: Facility[]
  startDate: Date
  dayFilter: DayFilter
  minDuration: number
  showBooked: boolean
  onBook: (slot: SelectedSlot) => void
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
}: ScheduleGridProps) {
  const dates = getWindowDates(startDate).filter(d => isVisibleDay(d, dayFilter) && !isPast(d))

  const queriesByFacilityId = Object.fromEntries(
    facilityIds.map((id, i) => [id, queries[i]]),
  )

  if (facilityIds.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-16 px-6">
        Välj minst en anläggning för att se lediga tider.
      </p>
    )
  }

  return (
    <div className="px-3 pt-2 pb-16 lg:pb-6">
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

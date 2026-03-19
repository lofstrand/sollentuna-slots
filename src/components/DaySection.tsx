import type { Facility, FacilityQuery, SelectedSlot } from '../types'
import { computeFreeSlots, formatDayLabel, toDateString } from '../lib/schedule'
import { FacilitySlots } from './FacilitySlots'

interface DaySectionProps {
  date: Date
  facilityIds: number[]
  facilities: Facility[]
  queriesByFacilityId: Record<number, FacilityQuery>
  minDuration: number
  showBooked: boolean
  showEmpty: boolean
  onBook: (slot: SelectedSlot) => void
}

function hasFreeSlots(
  facilityIds: number[],
  queriesByFacilityId: Record<number, FacilityQuery>,
  dateStr: string,
  minDuration: number,
): boolean {
  return facilityIds.some(id => {
    const q = queriesByFacilityId[id]
    if (!q?.data) return false
    return computeFreeSlots(q.data.events, dateStr, minDuration).length > 0
  })
}

function isAnyLoading(
  facilityIds: number[],
  queriesByFacilityId: Record<number, FacilityQuery>,
): boolean {
  return facilityIds.some(id => queriesByFacilityId[id]?.isLoading)
}

export function DaySection({
  date,
  facilityIds,
  facilities,
  queriesByFacilityId,
  minDuration,
  showBooked,
  showEmpty,
  onBook,
}: DaySectionProps) {
  const dateStr = toDateString(date)
  const loading = isAnyLoading(facilityIds, queriesByFacilityId)
  const hasSlots = hasFreeSlots(facilityIds, queriesByFacilityId, dateStr, minDuration)
  const showContent = loading || hasSlots

  if (!showContent) return null

  const visibleFacilities = facilities.filter(f => facilityIds.includes(f.id))

  return (
    <section className="mb-4">
      <div className="w-full flex items-center px-4 py-2.5 bg-gray-100 rounded-lg">
        <span className="font-semibold text-gray-800 capitalize">{formatDayLabel(date)}</span>
      </div>
      <div className="mt-2 px-1 space-y-1">
        {visibleFacilities.map(facility => (
          <FacilitySlots
            key={facility.id}
            facility={facility}
            data={queriesByFacilityId[facility.id]?.data}
            isLoading={queriesByFacilityId[facility.id]?.isLoading ?? false}
            isError={queriesByFacilityId[facility.id]?.isError ?? false}
            date={date}
            minDuration={minDuration}
            showBooked={showBooked}
            showEmpty={showEmpty}
            onBook={onBook}
          />
        ))}
      </div>
    </section>
  )
}

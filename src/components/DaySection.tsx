import type { Facility, FacilityQuery, SelectedSlot } from '../types'
import { computeFreeSlots, formatDayLabel, toDateString, isPast } from '../lib/schedule'
import { FacilityGroup } from './FacilityGroup'

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

function countFreeSlots(
  facilityIds: number[],
  queriesByFacilityId: Record<number, FacilityQuery>,
  dateStr: string,
  minDuration: number,
): number {
  let count = 0
  for (const id of facilityIds) {
    const q = queriesByFacilityId[id]
    if (q?.data) count += computeFreeSlots(q.data.events, dateStr, minDuration).length
  }
  return count
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
  const past = isPast(date)
  if (past) return null

  const loading = isAnyLoading(facilityIds, queriesByFacilityId)
  const freeCount = countFreeSlots(facilityIds, queriesByFacilityId, dateStr, minDuration)
  const showContent = showEmpty || loading || freeCount > 0

  if (!showContent) return null

  const visibleFacilities = facilities.filter(f => facilityIds.includes(f.id))

  const groupMap = new Map<string, Facility[]>()
  for (const facility of visibleFacilities) {
    const list = groupMap.get(facility.group) ?? []
    groupMap.set(facility.group, [...list, facility])
  }
  const groups = [...groupMap.entries()]

  const today = new Date()
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  return (
    <section className="mb-6">
      <div className="px-4 pt-2 pb-3">
        <h2 className="font-display text-title-lg text-on-surface capitalize">
          {isToday
            ? `Idag, ${date.getDate()} ${formatDayLabel(date).split(' ').slice(2).join(' ')}`
            : formatDayLabel(date)}
        </h2>
      </div>

      <div className="grid gap-4">
        {groups.map(([groupName, groupFacilities]) => (
          <FacilityGroup
            key={groupName}
            groupName={groupName}
            facilities={groupFacilities}
            queriesByFacilityId={queriesByFacilityId}
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

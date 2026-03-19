import { useState } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Facility, InterbookResponse, SelectedSlot } from '../types'
import { computeFreeSlots, formatDayLabel, toDateString } from '../lib/schedule'
import { FacilitySlots } from './FacilitySlots'

interface DaySectionProps {
  date: Date
  facilityIds: number[]
  facilities: Facility[]
  queriesByFacilityId: Record<number, UseQueryResult<InterbookResponse>>
  minDuration: number
  showBooked: boolean
  onBook: (slot: SelectedSlot) => void
}

function hasFreeSlots(
  facilityIds: number[],
  queriesByFacilityId: Record<number, UseQueryResult<InterbookResponse>>,
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
  queriesByFacilityId: Record<number, UseQueryResult<InterbookResponse>>,
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
  onBook,
}: DaySectionProps) {
  const dateStr = toDateString(date)
  const loading = isAnyLoading(facilityIds, queriesByFacilityId)
  const hasSlots = hasFreeSlots(facilityIds, queriesByFacilityId, dateStr, minDuration)
  const collapsed = !loading && !hasSlots

  const [expanded, setExpanded] = useState(false)
  const isOpen = !collapsed || expanded

  const visibleFacilities = facilities.filter(f => facilityIds.includes(f.id))

  return (
    <section className="mb-4">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-100 rounded-lg text-left"
      >
        <span className="font-semibold text-gray-800 capitalize">{formatDayLabel(date)}</span>
        <span className="text-sm text-gray-500">
          {collapsed ? (
            <span className="text-gray-400 italic text-xs">Inga lediga tider</span>
          ) : (
            <span className="text-green-700 text-xs font-medium">Lediga tider ✓</span>
          )}
          <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
        </span>
      </button>

      {isOpen && (
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
              onBook={onBook}
            />
          ))}
        </div>
      )}
    </section>
  )
}

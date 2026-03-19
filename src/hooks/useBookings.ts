import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { FacilityQuery, InterbookResponse } from '../types'
import { fetchBookings } from '../api/bookings'
import type { ViewMode } from '../components/Header'
import { FETCH_DAYS } from '../constants'

export interface UseBookingsOptions {
  facilityIds: number[]
  viewDate: Date
  viewMode: ViewMode
}

export interface UseBookingsResult {
  /** One query-status object per facility, in the same order as facilityIds */
  queries: FacilityQuery[]
  /** Lookup by facility id */
  queriesByFacilityId: Record<number, FacilityQuery>
  /** Raw response keyed by facility id */
  data: Record<number, InterbookResponse> | undefined
  isLoading: boolean
  isError: boolean
  refetch: () => void
  /** Start of the fetch window (for debugging) */
  fetchStart: Date
  /** Number of days fetched (for debugging) */
  fetchDays: number
}

/**
 * Central hook for fetching booking data from the Interbook API.
 *
 * Both the list view and calendar view use this hook so the fetch window
 * calculation, query key, and caching all live in one place.
 *
 * List mode:     fetches FETCH_DAYS (7) days from viewDate.
 * Calendar mode: fetches the entire month containing viewDate.
 */
export function useBookings({ facilityIds, viewDate, viewMode }: UseBookingsOptions): UseBookingsResult {
  // Derive the fetch window from the active view mode.
  const fetchStart = viewMode === 'calendar'
    ? new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    : viewDate
  const fetchDays = viewMode === 'calendar'
    ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    : FETCH_DAYS

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['bookings', facilityIds, fetchStart.toISOString(), fetchDays] as const,
    queryFn: () => fetchBookings({ resourceIds: facilityIds, weekStart: fetchStart, days: fetchDays }),
    staleTime: 60 * 60 * 1000,
    retry: 2,
    enabled: facilityIds.length > 0,
  })

  const queries: FacilityQuery[] = useMemo(
    () => facilityIds.map(id => ({
      data: data?.[id],
      isLoading,
      isError,
    })),
    [facilityIds, data, isLoading, isError],
  )

  const queriesByFacilityId = useMemo(
    () => Object.fromEntries(facilityIds.map((id, i) => [id, queries[i]])),
    [facilityIds, queries],
  )

  return { queries, queriesByFacilityId, data, isLoading, isError, refetch, fetchStart, fetchDays }
}

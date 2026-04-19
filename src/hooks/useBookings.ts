import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { FacilityQuery, InterbookResponse } from '../types'
import { fetchBookings } from '../api/bookings'
import { FETCH_DAYS } from '../constants'

export interface UseBookingsOptions {
  facilityIds: number[]
  viewDate: Date
}

export interface UseBookingsResult {
  queries: FacilityQuery[]
  queriesByFacilityId: Record<number, FacilityQuery>
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

function adjacentMonth(d: Date, offset: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1)
}

/** Build the query key for a given month. */
function bookingsKey(facilityIds: number[], month: Date) {
  return ['bookings', facilityIds, monthStart(month).toISOString()] as const
}

/** Does the 7-day list window starting at `viewDate` cross into the next month? */
function listWindowCrossesMonth(viewDate: Date): boolean {
  const end = new Date(viewDate)
  end.setDate(viewDate.getDate() + FETCH_DAYS - 1)
  return end.getMonth() !== viewDate.getMonth()
}

// ---------------------------------------------------------------------------
// Merge helper — combines two per-facility response maps into one.
// ---------------------------------------------------------------------------

function mergeResponses(
  a: Record<number, InterbookResponse> | undefined,
  b: Record<number, InterbookResponse> | undefined,
  facilityIds: number[],
): Record<number, InterbookResponse> | undefined {
  if (!a && !b) return undefined
  if (!a) return b
  if (!b) return a
  const result: Record<number, InterbookResponse> = {}
  for (const id of facilityIds) {
    const aData = a[id]
    const bData = b[id]
    if (aData && bData) {
      result[id] = {
        workDayStartHour: aData.workDayStartHour,
        workDayEndHour: aData.workDayEndHour,
        events: [...aData.events, ...bData.events],
      }
    } else {
      result[id] = (aData ?? bData)!
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Central hook for fetching booking data from the Interbook API.
 *
 * Always fetches full months so that both list and calendar views share the
 * same cache entries. When the list view's 7-day window crosses a month
 * boundary a second query covers the overflow month.
 *
 * After the primary month loads, adjacent months (prev + next) are
 * prefetched in the background for instant navigation.
 */
export function useBookings({ facilityIds, viewDate }: UseBookingsOptions): UseBookingsResult {
  const queryClient = useQueryClient()
  const enabled = facilityIds.length > 0

  // Primary month
  const primaryMonth = monthStart(viewDate)
  const primaryDays = daysInMonth(viewDate)

  const primary = useQuery({
    queryKey: bookingsKey(facilityIds, primaryMonth),
    queryFn: () => fetchBookings({ resourceIds: facilityIds, weekStart: primaryMonth, days: primaryDays }),
    enabled,
  })

  // Overflow month — only needed when list window crosses a month boundary
  const needsOverflow = listWindowCrossesMonth(viewDate)
  const overflowMonth = adjacentMonth(viewDate, 1)
  const overflowDays = daysInMonth(overflowMonth)

  const overflow = useQuery({
    queryKey: bookingsKey(facilityIds, overflowMonth),
    queryFn: () => fetchBookings({ resourceIds: facilityIds, weekStart: overflowMonth, days: overflowDays }),
    enabled: enabled && needsOverflow,
  })

  // Merge primary + overflow data
  const merged = useMemo(
    () => mergeResponses(primary.data, needsOverflow ? overflow.data : undefined, facilityIds),
    [primary.data, overflow.data, needsOverflow, facilityIds],
  )

  const isLoading = primary.isLoading || (needsOverflow && overflow.isLoading)
  const isError = primary.isError || (needsOverflow && overflow.isError)

  const queries: FacilityQuery[] = useMemo(
    () => facilityIds.map(id => ({
      data: merged?.[id],
      isLoading,
      isError,
    })),
    [facilityIds, merged, isLoading, isError],
  )

  const queriesByFacilityId = useMemo(
    () => Object.fromEntries(facilityIds.map((id, i) => [id, queries[i]])),
    [facilityIds, queries],
  )

  // ---------------------------------------------------------------------------
  // Prefetch adjacent months once the primary query succeeds
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || primary.status !== 'success') return

    const prefetch = () => {
      for (const offset of [-1, 1]) {
        const adj = adjacentMonth(viewDate, offset)
        const days = daysInMonth(adj)
        queryClient.prefetchQuery({
          queryKey: bookingsKey(facilityIds, adj),
          queryFn: () => fetchBookings({ resourceIds: facilityIds, weekStart: monthStart(adj), days }),
        })
      }
    }

    // Use requestIdleCallback so prefetch doesn't compete with rendering
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(prefetch)
      return () => cancelIdleCallback(id)
    } else {
      const id = setTimeout(prefetch, 2000)
      return () => clearTimeout(id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, primary.status, viewDate.getMonth(), viewDate.getFullYear(), facilityIds, queryClient])

  function refetch() {
    primary.refetch()
    if (needsOverflow) overflow.refetch()
  }

  return { queries, queriesByFacilityId, isLoading, isError, refetch }
}

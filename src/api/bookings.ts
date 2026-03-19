import type { InterbookResponse } from '../types'

export interface BookingsQueryParams {
  resourceIds: number[]
  weekStart: Date
  days?: number
}

const CHUNK_SIZE = 20

const BOOKINGS_URL = import.meta.env.PROD
  ? 'https://sollentuna.interbookfri.se/BookingAPI/GetBookingsForSchedule'
  : '/api/bookings'

async function fetchBookingsChunk(
  resourceIds: number[],
  start: string,
  end: string,
): Promise<InterbookResponse> {
  const res = await fetch(BOOKINGS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resources: resourceIds, start, end, timestamp: new Date().toISOString(), isPublic: true }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const raw = await res.json()
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

export async function fetchBookings({
  resourceIds,
  weekStart,
  days = 14,
}: BookingsQueryParams): Promise<Record<number, InterbookResponse>> {
  const end = new Date(weekStart)
  end.setDate(weekStart.getDate() + days - 1)

  // NOTE: 23:00 UTC ≈ midnight CET (UTC+1). Incorrect during CEST (UTC+2) — server accepts it regardless.
  const startStr = weekStart.toISOString().slice(0, 10) + 'T23:00:00.000Z'
  const endStr   = end.toISOString().slice(0, 10) + 'T23:00:00.000Z'

  // Chunk to avoid hitting the API's resource-count limit
  const chunks: number[][] = []
  for (let i = 0; i < resourceIds.length; i += CHUNK_SIZE) {
    chunks.push(resourceIds.slice(i, i + CHUNK_SIZE))
  }

  const responses = await Promise.all(chunks.map(chunk => fetchBookingsChunk(chunk, startStr, endStr)))

  // Merge all chunk responses and split by facility
  const allEvents = responses.flatMap(r => r.events)
  const workDayStartHour = responses[0]?.workDayStartHour ?? 7
  const workDayEndHour   = responses[0]?.workDayEndHour   ?? 23

  const result: Record<number, InterbookResponse> = {}
  for (const id of resourceIds) {
    result[id] = {
      workDayStartHour,
      workDayEndHour,
      events: allEvents.filter(e => Number(e.facilityObjectId) === id),
    }
  }
  return result
}

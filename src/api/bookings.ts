import type { InterbookResponse } from '../types'

export interface BookingsQueryParams {
  resourceIds: number[]
  weekStart: Date
  days?: number
}

// Realistic mock data used when the proxy is unreachable (e.g. in devcontainer).
function buildMockResponse(weekStart: Date, resourceId: number): InterbookResponse {
  const events: InterbookResponse['events'] = []
  const seed = resourceId * 7

  for (let d = 0; d < 14; d++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + d)
    const dateStr = date.toISOString().slice(0, 10)
    const dow = date.getDay()

    // Weekdays: add a training block 17–19
    if (dow >= 1 && dow <= 5) {
      events.push({
        id: `mock-${resourceId}-${d}-train`,
        start: `${dateStr}T17:00`,
        end: `${dateStr}T19:00`,
        type: 'normal',
        status: 'booked',
        description: '<p>Träning IFK</p>',
        occasionType: 1,
        recurring: '',
        facilityObjectId: String(resourceId),
      })
    }

    // Saturdays: morning match 10–12, afternoon slot free
    if (dow === 6) {
      events.push({
        id: `mock-${resourceId}-${d}-match`,
        start: `${dateStr}T10:00`,
        end: `${dateStr}T12:00`,
        type: 'match',
        status: 'booked',
        description: '<p>Match: IFK – Sollentuna</p>',
        occasionType: 2,
        recurring: '',
        facilityObjectId: String(resourceId),
      })
      // Add a training in the evening so there's a free midday gap (varies by facility)
      if (seed % 3 !== 0) {
        events.push({
          id: `mock-${resourceId}-${d}-eve`,
          start: `${dateStr}T20:00`,
          end: `${dateStr}T22:00`,
          type: 'normal',
          status: 'booked',
          description: '<p>Träning</p>',
          occasionType: 1,
          recurring: '',
          facilityObjectId: String(resourceId),
        })
      }
    }

    // Sundays: closed morning, open afternoon
    if (dow === 0) {
      events.push({
        id: `mock-${resourceId}-${d}-closed`,
        start: `${dateStr}T07:00`,
        end: `${dateStr}T10:00`,
        type: 'closed',
        status: '',
        description: '',
        occasionType: 0,
        recurring: '',
        facilityObjectId: String(resourceId),
      })
    }
  }

  return { workDayStartHour: 7, workDayEndHour: 23, events }
}

const CHUNK_SIZE = 20

async function fetchBookingsChunk(
  resourceIds: number[],
  start: string,
  end: string,
): Promise<InterbookResponse> {
  const res = await fetch('/api/bookings', {
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

  try {
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
  } catch (err) {
    // If the proxy is unreachable (devcontainer / no network), fall back to mock data.
    if (err instanceof TypeError) {
      console.warn(`[mock] fetchBookings: proxy unreachable, using mock data`)
      const result: Record<number, InterbookResponse> = {}
      for (const id of resourceIds) {
        result[id] = buildMockResponse(weekStart, id)
      }
      return result
    }
    throw err
  }
}

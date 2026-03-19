import type { InterbookResponse } from '../types'

export interface BookingsQueryParams {
  resourceId: number
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
      })
    }
  }

  return { workDayStartHour: 7, workDayEndHour: 23, events }
}

export async function fetchBookings({
  resourceId,
  weekStart,
  days = 14,
}: BookingsQueryParams): Promise<InterbookResponse> {
  const end = new Date(weekStart)
  end.setDate(weekStart.getDate() + days - 1)

  const toInterbookDate = (d: Date) =>
    d.toISOString().slice(0, 10) + 'T23:00:00.000Z' // NOTE: 23:00 UTC ≈ midnight CET (UTC+1). Incorrect during CEST (UTC+2) — server accepts it regardless.

  const body = {
    resources: [resourceId],
    start: toInterbookDate(weekStart),
    end: toInterbookDate(end),
    timestamp: new Date().toISOString(),
    isPublic: true,
  }

  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw = await res.json()
    return typeof raw === 'string' ? JSON.parse(raw) as InterbookResponse : raw as InterbookResponse
  } catch (err) {
    // If the proxy is unreachable (devcontainer / no network), fall back to mock data.
    if (err instanceof TypeError) {
      console.warn(`[mock] fetchBookings: proxy unreachable, using mock data for resource ${resourceId}`)
      return buildMockResponse(weekStart, resourceId)
    }
    // Non-network errors (bad status, parse failure) bubble up so React Query can handle them.
    throw err
  }
}

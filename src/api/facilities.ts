import type { Facility } from '../types'

interface InterbookFacility {
  Value: number
  Text: string
}

interface FacilitiesResponse {
  facilityObjects?: InterbookFacility[]
  FacilityObjects?: InterbookFacility[]
}

// Football venue names as returned by the API (first segment of the comma-separated Text)
// First segment of each facility's comma-separated Text, trimmed.
// "Sollentuna Fotbollshall " has a trailing space in the API — .trim() handles it.
const FOOTBALL_VENUES = new Set([
  'Norrvikens IP',
  'Helenelunds IP',
  'Kärrdals IP 1',
  'Edsbergs sportfält',
  'Sollentunavallen',
  'Sollentuna Fotbollshall',
  'Arena Rotebro',
  'Rotebro BP',
  'Bagarbyplanen',
  'Tegelhagens BP',
  'Vaxmora BP',
  'Viby BP',
])

const FACILITIES_URL = '/api/facilities'

export async function fetchFacilities(): Promise<Facility[]> {
  const res = await fetch(FACILITIES_URL)

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const raw: FacilitiesResponse = await res.json()
  const list = raw.facilityObjects ?? raw.FacilityObjects ?? []

  return list
    .map(f => {
      const commaIdx = f.Text.indexOf(',')
      if (commaIdx === -1) {
        // Standalone venue — no sub-object hierarchy
        return { id: f.Value, name: f.Text.trim(), group: f.Text.trim() }
      }
      const group = f.Text.slice(0, commaIdx).trim()
      const name = f.Text.slice(commaIdx + 1).trim()
      return { id: f.Value, name, group }
    })
    .filter(f => FOOTBALL_VENUES.has(f.group))
}

import type { Facility } from '../types'

const FOOTBALL_PAYLOAD = {
  facilityObjectSearchType: 0,
  searchText: null,
  activityTypes: [{ Value: 1, Text: 'Fotboll' }],
  facilityObjectTypes: [],
  districts: [],
  facilityObjects: [],
  filterAvailableTimes: false,
  isOvernight: false,
  filterSubscriptions: false,
  dateFrom: null,
  dateTo: null,
  timeFrom: null,
  timeTo: null,
  lengthOfBookingValue: 0,
  weekdays: [false, false, false, false, false, false, false],
}

// Shape returned by the API (only the fields we care about)
interface InterbookFacility {
  Value: number
  Text: string
  GroupText?: string
  FacilityName?: string
}

interface FacilitiesResponse {
  facilityObjects?: InterbookFacility[]
  FacilityObjects?: InterbookFacility[]
}

export async function fetchFacilities(): Promise<Facility[]> {
  const res = await fetch('/api/facilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(FOOTBALL_PAYLOAD),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const raw: FacilitiesResponse = await res.json()
  const list = raw.facilityObjects ?? raw.FacilityObjects ?? []

  return list.map(f => ({
    id: f.Value,
    name: f.Text,
    group: f.GroupText ?? f.FacilityName ?? 'Övrigt',
  }))
}

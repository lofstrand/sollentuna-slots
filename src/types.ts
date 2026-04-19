export type DayFilter = 'fri-sun' | 'all'

export interface Facility {
  id: number
  name: string
  group: string
}

export interface InterbookEvent {
  id: string | null
  start: string            // "2026-03-28T09:00"
  end: string
  type: 'closed' | 'normal' | 'match' | 'arrangement'
  status: 'booked' | ''
  description: string      // HTML string
  occasionType: number
  recurring: string
  facilityObjectId: string
}

export interface FacilityQuery {
  data: InterbookResponse | undefined
  isLoading: boolean
  isError: boolean
}

export interface InterbookResponse {
  workDayStartHour: number
  workDayEndHour: number
  events: InterbookEvent[]
}

export interface FreeSlot {
  startMin: number
  endMin: number
}

export interface BookingFormState {
  lagNamn: string
  ledarNamn: string
  ledarMail: string
  ledarTel: string
  bokningsTyp: 'träning' | 'match'
}

export interface SelectedSlot {
  facilityId: number
  facilityName: string
  date: string             // "YYYY-MM-DD"
  startMin: number
  endMin: number
  availableSlots: FreeSlot[]
}

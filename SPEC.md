# Technical Specification

Full implementation reference for the Sollentuna Football Slot Finder.
For architecture rationale see [`DECISIONS.md`](./DECISIONS.md).
For Claude Code guidance see [`CLAUDE.md`](./CLAUDE.md).

---

## Project Structure

```
src/
├── main.tsx
├── App.tsx
├── index.css
├── types.ts
├── constants.ts
├── api/
│   └── bookings.ts
├── lib/
│   ├── schedule.ts        # Pure functions: slot calc, date utils
│   └── template.ts        # applyTemplate() only
├── hooks/
│   └── useLocalStorage.ts
└── components/
    ├── Header.tsx          # Sticky: facility button, week nav, filter, duration
    ├── FacilityPicker.tsx  # Slide-in sheet, grouped checkboxes
    ├── ScheduleGrid.tsx    # Orchestrates days × facilities
    ├── DaySection.tsx      # Day header + collapse toggle + FacilitySlots
    ├── FacilitySlots.tsx   # Slots for one facility within a day
    ├── SlotRow.tsx         # Single row: free / training / match
    └── BookingSheet.tsx    # Bottom sheet: slot info + contact form + CTAs
```

---

## Types (`src/types.ts`)

```ts
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
  type: 'closed' | 'normal' | 'match'
  status: 'booked' | ''
  description: string      // HTML string
  occasionType: number
  recurring: string
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
}

export interface SelectedSlot {
  facilityId: number
  facilityName: string
  date: string             // "YYYY-MM-DD"
  startMin: number
  endMin: number
}
```

---

## Constants (`src/constants.ts`)

```ts
export const WORK_START_HOUR = 7
export const WORK_END_HOUR = 23
export const FETCH_DAYS = 14

export const BOOKING_EMAIL = 'idrottskonsulenter@sollentuna.se'
export const BOOKING_EMAIL_SUBJECT = 'Bokningsförfrågan fotbollsplan'

export const EMAIL_TEMPLATE = `Hej,

Vi önskar boka följande tid för träning/match:

Förening och lag: {lagNamn}
Ledare: {ledarNamn}
Mail: {ledarMail}
Telefon: {ledarTel}
Önskad tid: {onskadTid}

Med vänliga hälsningar,
{ledarNamn}`

export const FACILITIES: Facility[] = [ /* ... see full list in original spec ... */ ]
```

---

## localStorage Persistence

| Key | Type | Default |
|---|---|---|
| `sbf_facilityIds` | `number[]` | `[2]` |
| `sbf_dayFilter` | `'fri-sun' \| 'all'` | `'fri-sun'` |
| `sbf_minDuration` | `number` | `90` |
| `sbf_form` | `BookingFormState` | all empty strings |

`weekStart` is ephemeral — always Monday of current week on mount.

### `useLocalStorage` hook

```ts
import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch {
      console.warn(`useLocalStorage: failed to write key "${key}"`)
    }
  }

  return [storedValue, setValue] as const
}
```

---

## API Layer (`src/api/bookings.ts`)

```ts
export interface BookingsQueryParams {
  resourceId: number
  weekStart: Date
  days?: number       // default 14
}

export async function fetchBookings({
  resourceId,
  weekStart,
  days = 14,
}: BookingsQueryParams): Promise<InterbookResponse> {
  const end = new Date(weekStart)
  end.setDate(weekStart.getDate() + days - 1)

  const toInterbookDate = (d: Date) =>
    d.toISOString().slice(0, 10) + 'T23:00:00.000Z'

  const body = {
    resources: [resourceId],
    start: toInterbookDate(weekStart),
    end: toInterbookDate(end),
    timestamp: new Date().toISOString(),
    isPublic: true,
  }

  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const raw = await res.json()
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}
```

### React Query usage in `App.tsx`

```ts
const queries = useQueries({
  queries: facilityIds.map(id => ({
    queryKey: ['bookings', id, weekStart.toISOString()],
    queryFn: () => fetchBookings({ resourceId: id, weekStart }),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  }))
})
```

---

## Schedule Logic (`src/lib/schedule.ts`)

```ts
export function getMondayOfCurrentWeek(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWindowDates(monday: Date, days = 14): Date[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function isVisibleDay(date: Date, filter: DayFilter): boolean {
  const day = date.getDay()
  if (filter === 'fri-sun') return day === 5 || day === 6 || day === 0
  return true
}

export function formatDayLabel(date: Date): string {
  const DAYS = ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag']
  const MONTHS = ['januari','februari','mars','april','maj','juni',
                  'juli','augusti','september','oktober','november','december']
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function formatWeekLabel(monday: Date): string {
  const end = new Date(monday)
  end.setDate(monday.getDate() + 13)
  const w1 = getISOWeek(monday)
  const w2 = getISOWeek(end)
  return `V.${w1}–${w2}`
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function computeFreeSlots(
  events: InterbookEvent[],
  dateStr: string,
  minDuration: number
): FreeSlot[] {
  const dayEvents = events.filter(e => e.start.startsWith(dateStr))
  const busyMinutes = new Set<number>()

  dayEvents
    .filter(e => e.type === 'closed' || e.status === 'booked')
    .forEach(e => {
      const start = timeToMin(e.start.slice(11, 16))
      const end = timeToMin(e.end.slice(11, 16))
      for (let m = start; m < end; m++) busyMinutes.add(m)
    })

  const free: FreeSlot[] = []
  let freeStart: number | null = null

  for (let m = WORK_START_HOUR * 60; m <= WORK_END_HOUR * 60; m++) {
    const busy = busyMinutes.has(m)
    if (!busy && freeStart === null) {
      freeStart = m
    } else if ((busy || m === WORK_END_HOUR * 60) && freeStart !== null) {
      if (m - freeStart >= minDuration) {
        free.push({ startMin: freeStart, endMin: m })
      }
      freeStart = null
    }
  }

  return free
}
```

---

## Email Template (`src/lib/template.ts`)

```ts
export interface TemplateVars {
  lagNamn: string
  ledarNamn: string
  ledarMail: string
  ledarTel: string
  onskadTid: string
}

export function applyTemplate(template: string, vars: TemplateVars): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value || `{${key}}`),
    template
  )
}
```

---

## Proxy Configuration (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/bookings': {
        target: 'https://sollentuna.interbookfri.se',
        changeOrigin: true,
        rewrite: () => '/BookingAPI/GetBookingsForSchedule',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest')
            proxyReq.setHeader('Referer', 'https://sollentuna.interbookfri.se/')
            proxyReq.setHeader('Origin', 'https://sollentuna.interbookfri.se')
          })
        },
      },
    },
  },
})
```

---

## Component Props

### `Header.tsx`
```ts
interface HeaderProps {
  facilityIds: number[]
  onOpenFacilityPicker: () => void
  weekStart: Date
  onWeekChange: (direction: -1 | 1) => void
  dayFilter: DayFilter
  onDayFilterChange: (f: DayFilter) => void
  minDuration: number
  onMinDurationChange: (n: number) => void
}
```

### `FacilityPicker.tsx`
```ts
interface FacilityPickerProps {
  open: boolean
  selected: number[]
  onChange: (ids: number[]) => void
  onClose: () => void
}
```

### `ScheduleGrid.tsx`
```ts
interface ScheduleGridProps {
  queries: UseQueryResult<InterbookResponse>[]
  facilityIds: number[]
  weekStart: Date
  dayFilter: DayFilter
  minDuration: number
  onBook: (slot: SelectedSlot) => void
}
```

### `DaySection.tsx`
```ts
interface DaySectionProps {
  date: Date
  facilityIds: number[]
  queriesByFacilityId: Record<number, UseQueryResult<InterbookResponse>>
  minDuration: number
  onBook: (slot: SelectedSlot) => void
}
```

### `FacilitySlots.tsx`
```ts
interface FacilitySlotsProps {
  facility: Facility
  data: InterbookResponse | undefined
  isLoading: boolean
  isError: boolean
  date: Date
  minDuration: number
  onBook: (slot: SelectedSlot) => void
}
```

### `SlotRow.tsx`
```ts
interface SlotRowProps {
  type: 'free' | 'training' | 'match'
  startMin: number
  endMin: number
  description?: string
  onBook?: () => void
}
```

### `BookingSheet.tsx`
```ts
interface BookingSheetProps {
  slot: SelectedSlot | null
  form: BookingFormState
  onFormChange: (form: BookingFormState) => void
  onClose: () => void
}
```

---

## UI: Slot Row Colors (Tailwind)

| Type | Classes |
|---|---|
| Free | `bg-green-50 border-l-4 border-green-400 text-green-900` |
| Training | `bg-gray-50 text-gray-600` |
| Match | `bg-orange-50 border-l-4 border-orange-300 text-orange-900` |

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Proxy unreachable | `isError` per query → error banner per facility within DaySection |
| Interbook non-200 | Throw in `fetchBookings`, surfaced via `isError` |
| JSON parse failure | Catch and rethrow with descriptive message |
| Clipboard unavailable | Select all text in preview textarea as fallback |

---

## Tailwind Config

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

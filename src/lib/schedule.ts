import type { DayFilter, FreeSlot, InterbookEvent } from '../types'
import { WORK_START_HOUR, WORK_END_HOUR } from '../constants'

export function getMondayOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export function getMondayOfCurrentWeek(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/** All dates in a given month (year/month are local). */
export function getMonthDates(year: number, month: number): Date[] {
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))
}

const MONTHS_LONG = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
]

export function formatMonthLabel(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`
}

export function formatListRangeLabel(start: Date): string {
  return `Vecka ${getISOWeek(start)}`
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
  const DAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS_LONG[date.getMonth()]!.toLowerCase()}`
}

export function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7,
    )
  )
}

export function formatWeekLabel(monday: Date): string {
  const end = new Date(monday)
  end.setDate(monday.getDate() + 13)
  const w1 = getISOWeek(monday)
  const w2 = getISOWeek(end)
  return `V.${w1}–${w2}`
}

export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isPast(date: Date): boolean {
  return toDateString(date) < toDateString(new Date())
}

/** Returns the next Friday if date falls Mon–Thu, null if already Fri/Sat/Sun. */
export function getNextFriday(date: Date): Date | null {
  const day = date.getDay()
  if (day === 5 || day === 6 || day === 0) return null
  const next = new Date(date)
  next.setDate(date.getDate() + (5 - day))
  return next
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
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
  minDuration: number,
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

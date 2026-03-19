import type { Facility } from './types'

export const WORK_START_HOUR = 7
export const WORK_END_HOUR = 23
export const FETCH_DAYS = 14
export const MIN_BOOKING_DURATION = 60  // minimum bookable duration in minutes

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

export const FACILITIES: Facility[] = [
  // Norrvikens IP
  { id: 1,  name: 'Norrvikens IP – Plan 1',       group: 'Norrvikens IP' },
  { id: 2,  name: 'Norrvikens IP – Plan 2',       group: 'Norrvikens IP' },
  // Helenelunds IP
  { id: 3,  name: 'Helenelunds IP – Plan 1',      group: 'Helenelunds IP' },
  { id: 4,  name: 'Helenelunds IP – Plan 2',      group: 'Helenelunds IP' },
  // Edsbergs sportfält
  { id: 5,  name: 'Edsbergs sportfält – Plan 1',  group: 'Edsbergs sportfält' },
  { id: 6,  name: 'Edsbergs sportfält – Plan 2',  group: 'Edsbergs sportfält' },
  // Kärrdals IP
  { id: 7,  name: 'Kärrdals IP – Plan 1',         group: 'Kärrdals IP' },
  { id: 8,  name: 'Kärrdals IP – Plan 2',         group: 'Kärrdals IP' },
  // Sollentunavallen
  { id: 9,  name: 'Sollentunavallen – Plan 1',    group: 'Sollentunavallen' },
  { id: 10, name: 'Sollentunavallen – Plan 2',    group: 'Sollentunavallen' },
  // Sollentuna Fotbollshall
  { id: 11, name: 'Fotbollshall – Hall 1',        group: 'Sollentuna Fotbollshall' },
  { id: 12, name: 'Fotbollshall – Hall 2',        group: 'Sollentuna Fotbollshall' },
  // Övriga planer
  { id: 13, name: 'Bagarbyn',                     group: 'Övriga planer' },
  { id: 14, name: 'Tegelhagen',                   group: 'Övriga planer' },
  { id: 15, name: 'Vaxmora',                      group: 'Övriga planer' },
  { id: 16, name: 'Viby',                         group: 'Övriga planer' },
  { id: 17, name: 'Rotebro',                      group: 'Övriga planer' },
]

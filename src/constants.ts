import type { Facility } from './types'

export const WORK_START_HOUR = 7
export const WORK_END_HOUR = 23
export const FETCH_DAYS = 7
export const MIN_BOOKING_DURATION = 60  // minimum bookable duration in minutes

export const BOOKING_EMAIL = 'idrottskonsulenter@sollentuna.se'
export const BOOKING_EMAIL_SUBJECT = 'Bokningsförfrågan fotbollsplan'

export const EMAIL_TEMPLATE = `Hej,

Vi önskar boka en plan för {bokningsTyp} enligt följande:

Förening/lag: {lagNamn}
Plan: {plan}
Datum: {datum}
Tid: {tid}

Vänligen återkom om tiden är tillgänglig.

Med vänliga hälsningar,
{ledarNamn}
{ledarMail} | {ledarTel}`

export const FACILITIES: Facility[] = [
  // Norrvikens IP
  { id: 2,   name: '11-plan konstgräs',                                              group: 'Norrvikens IP' },
  { id: 3,   name: '11-plan konstgräs, Halvplan 11',                                 group: 'Norrvikens IP' },
  { id: 5,   name: '11-plan konstgräs, Halvplan 11, Fjärdedelsplan 115',             group: 'Norrvikens IP' },
  { id: 6,   name: '11-plan konstgräs, Halvplan 11, Fjärdedelsplan 116',             group: 'Norrvikens IP' },
  { id: 4,   name: '11-plan konstgräs, Halvplan 12',                                 group: 'Norrvikens IP' },
  { id: 7,   name: '11-plan konstgräs, Halvplan 12, Fjärdedelsplan 125',             group: 'Norrvikens IP' },
  { id: 8,   name: '11-plan konstgräs, Halvplan 12, Fjärdedelsplan 126',             group: 'Norrvikens IP' },
  // Helenelunds IP
  { id: 116, name: '11-plan konstgräs HIP 1',                                        group: 'Helenelunds IP' },
  { id: 55,  name: '11-plan konstgräs HIP 1, Halvplan 11 HIP',                       group: 'Helenelunds IP' },
  { id: 117, name: '11-plan konstgräs HIP 1, Halvplan 11 HIP, Fjärdedelsplan 115',   group: 'Helenelunds IP' },
  { id: 118, name: '11-plan konstgräs HIP 1, Halvplan 11 HIP, Fjärdedelsplan 116',   group: 'Helenelunds IP' },
  { id: 60,  name: '11-plan konstgräs HIP 1, Halvplan 12 HIP',                       group: 'Helenelunds IP' },
  { id: 61,  name: '11-plan konstgräs HIP 1, Halvplan 12 HIP, Fjärdedelsplan 125',   group: 'Helenelunds IP' },
  { id: 62,  name: '11-plan konstgräs HIP 1, Halvplan 12 HIP, Fjärdedelsplan 126',   group: 'Helenelunds IP' },
  { id: 140, name: '7-spelsplan',                                                     group: 'Helenelunds IP' },
  { id: 141, name: '7-spelsplan, Halv 7-spelsplan 25',                               group: 'Helenelunds IP' },
  { id: 142, name: '7-spelsplan, Halv 7-spelsplan 26',                               group: 'Helenelunds IP' },
  // Kärrdals IP 1
  { id: 119, name: '11-plan konstgräs',                                              group: 'Kärrdals IP 1' },
  { id: 59,  name: '11-plan konstgräs, Halvplan 11 KIP',                             group: 'Kärrdals IP 1' },
  { id: 123, name: '11-plan konstgräs, Halvplan 11 KIP, Fjärdedelsplan 115',         group: 'Kärrdals IP 1' },
  { id: 124, name: '11-plan konstgräs, Halvplan 11 KIP, Fjärdedelsplan 116',         group: 'Kärrdals IP 1' },
  { id: 120, name: '11-plan konstgräs, Halvplan 12 KIP',                             group: 'Kärrdals IP 1' },
  { id: 121, name: '11-plan konstgräs, Halvplan 12 KIP, Fjärdedelsplan 125',         group: 'Kärrdals IP 1' },
  { id: 122, name: '11-plan konstgräs, Halvplan 12 KIP, Fjärdedelsplan 126',         group: 'Kärrdals IP 1' },
  // Edsbergs sportfält
  { id: 115, name: '11-plan konstgräs plan SPF 2',                                   group: 'Edsbergs sportfält' },
  { id: 72,  name: '11-plan konstgräs plan SPF 2, Halvplan 21',                      group: 'Edsbergs sportfält' },
  { id: 73,  name: '11-plan konstgräs plan SPF 2, Halvplan 21, Fjärdedelsplan 215',  group: 'Edsbergs sportfält' },
  { id: 74,  name: '11-plan konstgräs plan SPF 2, Halvplan 21, Fjärdedelsplan 216',  group: 'Edsbergs sportfält' },
  { id: 75,  name: '11-plan konstgräs plan SPF 2, Halvplan 22',                      group: 'Edsbergs sportfält' },
  { id: 76,  name: '11-plan konstgräs plan SPF 2, Halvplan 22, Fjärdedelsplan 225',  group: 'Edsbergs sportfält' },
  { id: 77,  name: '11-plan konstgräs plan SPF 2, Halvplan 22, Fjärdedelsplan 226',  group: 'Edsbergs sportfält' },
  { id: 114, name: '11-plan konstgräs plan SPF 3',                                   group: 'Edsbergs sportfält' },
  { id: 79,  name: '11-plan konstgräs plan SPF 3, Halvplan 31',                      group: 'Edsbergs sportfält' },
  { id: 98,  name: '11-plan konstgräs plan SPF 3, Halvplan 31, Fjärdedelsplan 315',  group: 'Edsbergs sportfält' },
  { id: 99,  name: '11-plan konstgräs plan SPF 3, Halvplan 31, Fjärdedelsplan 316',  group: 'Edsbergs sportfält' },
  { id: 81,  name: '11-plan konstgräs plan SPF 3, Halvplan 32',                      group: 'Edsbergs sportfält' },
  { id: 100, name: '11-plan konstgräs plan SPF 3, Halvplan 32, Fjärdedelsplan 325',  group: 'Edsbergs sportfält' },
  { id: 101, name: '11-plan konstgräs plan SPF 3, Halvplan 32, Fjärdedelsplan 326',  group: 'Edsbergs sportfält' },
  { id: 97,  name: 'Edsbergs sportfält SPF 4',                                       group: 'Edsbergs sportfält' },
  // Sollentunavallen
  { id: 106, name: '11-plan konstgräs Vallen 2',                                     group: 'Sollentunavallen' },
  { id: 107, name: '11-plan konstgräs Vallen 2, Halvplan 21',                        group: 'Sollentunavallen' },
  { id: 111, name: '11-plan konstgräs Vallen 2, Halvplan 21, Fjärdedelsplan 215',    group: 'Sollentunavallen' },
  { id: 112, name: '11-plan konstgräs Vallen 2, Halvplan 21, Fjärdedelsplan 216',    group: 'Sollentunavallen' },
  { id: 108, name: '11-plan konstgräs Vallen 2, Halvplan 22',                        group: 'Sollentunavallen' },
  { id: 109, name: '11-plan konstgräs Vallen 2, Halvplan 22, Fjärdedelsplan 225',    group: 'Sollentunavallen' },
  { id: 110, name: '11-plan konstgräs Vallen 2, Halvplan 22, Fjärdedelsplan 226',    group: 'Sollentunavallen' },
  { id: 69,  name: 'Sollentunavallen 1, friidrottsbanor',                            group: 'Sollentunavallen' },
  { id: 70,  name: 'Sollentunavallen 1, naturgräs',                                  group: 'Sollentunavallen' },
  // Sollentuna Fotbollshall
  { id: 126, name: '11-plan konstgräs',                                              group: 'Sollentuna Fotbollshall' },
  { id: 127, name: '11-plan konstgräs, Halvplan 11',                                 group: 'Sollentuna Fotbollshall' },
  { id: 128, name: '11-plan konstgräs, Halvplan 11, Fjärdedelsplan 115',             group: 'Sollentuna Fotbollshall' },
  { id: 129, name: '11-plan konstgräs, Halvplan 11, Fjärdedelsplan 116',             group: 'Sollentuna Fotbollshall' },
  { id: 130, name: '11-plan konstgräs, Halvplan 12',                                 group: 'Sollentuna Fotbollshall' },
  { id: 131, name: '11-plan konstgräs, Halvplan 12, Fjärdedelsplan 125',             group: 'Sollentuna Fotbollshall' },
  { id: 132, name: '11-plan konstgräs, Halvplan 12, Fjärdedelsplan 126',             group: 'Sollentuna Fotbollshall' },
  // Övriga planer
  { id: 24,  name: 'Arena Rotebro',                                                  group: 'Övriga planer' },
  { id: 92,  name: 'Bagarbyplanen',                                                  group: 'Övriga planer' },
  { id: 96,  name: 'Rotebro BP',                                                     group: 'Övriga planer' },
  { id: 93,  name: 'Tegelhagens BP',                                                 group: 'Övriga planer' },
  { id: 94,  name: 'Vaxmora BP',                                                     group: 'Övriga planer' },
  { id: 95,  name: 'Viby BP',                                                        group: 'Övriga planer' },
]

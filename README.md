# Sollentuna Football Slot Finder

A mobile-first single-page application that queries the Sollentuna municipality's
[Interbook](https://sollentuna.interbookfri.se) booking system to display available
time slots on football pitches, and helps the user compose a booking request email.

**UI language:** Swedish. Booking emails are sent to `idrottskonsulenter@sollentuna.se`.

---

## Prerequisites

- Node.js 18+
- npm

---

## Setup

```bash
npm install
npm run dev
```

> The Vite dev-server proxy is required at runtime — the app fetches `/api/bookings`
> which is rewritten to `https://sollentuna.interbookfri.se/BookingAPI/GetBookingsForSchedule`.
> Running `npm run build` + deploying the static files without a proxy will break data fetching.

---

## Development

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build
npm run preview    # Preview production build locally
npm run lint       # Run ESLint
```

---

## How It Works

1. On load, the app fetches the live football facility list from Interbook (cached for the session)
2. User selects one or more pitches via a full-screen slide-in picker, grouped by venue
3. The app fetches booking data for each selected pitch in parallel (14-day window)
4. Free slots ≥ minimum display duration (default 90 min) are shown in green
5. Past dates are hidden; days with no free slots are collapsed
6. Two views available: **list** (day-by-day) and **calendar** (2-week grid with availability dots)
7. Tapping "Boka" on a free slot opens a bottom sheet where you:
   - Pick your exact start and end time within the slot using a range slider or time inputs (15-min steps, minimum 1 h)
   - Fill in contact details (persisted in localStorage)
   - Send via mail client or copy the pre-filled email text

---

## Facilities Covered

Fetched dynamically from Interbook on startup. Falls back to a hardcoded list if unavailable.
Venues include:

- Norrvikens IP
- Helenelunds IP
- Edsbergs sportfält
- Kärrdals IP
- Sollentunavallen
- Sollentuna Fotbollshall
- Övriga planer (Bagarbyn, Tegelhagen, Vaxmora, Viby, Rotebro)

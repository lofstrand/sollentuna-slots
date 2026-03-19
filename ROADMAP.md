# Roadmap

---

## v1 — Current Scope

The goal of v1 is a working, mobile-first local tool for finding and requesting
football pitch time slots in Sollentuna municipality.

### In Scope

- [x] Vite + React + TypeScript project setup
- [x] Tailwind theme
- [x] Vite proxy for Interbook CORS bypass
- [x] Multi-facility selection (slide-in sheet, grouped by venue)
- [x] 14-day schedule view with week navigation (±7 days)
- [x] Day filter: Friday–Sunday (default) / All days
- [x] Configurable minimum free slot duration (default 90 min)
- [x] Parallel data fetching with TanStack Query (`useQueries`)
- [x] Free slot calculation (`computeFreeSlots`)
- [x] Schedule grid: DaySection → FacilitySlots → SlotRow
- [x] Collapsed days when no free slots exist
- [x] Event type rendering: free (green), training (🏃 gray), match (⚽ orange)
- [x] Bottom sheet booking flow
- [x] Contact form with localStorage persistence
- [x] Fixed email template with `{token}` substitution
- [x] "Öppna i mailklient" (`mailto:`) and "Kopiera text" (clipboard) actions
- [x] Loading skeletons and error states
- [x] All user-facing text in Swedish
- [x] Multi-week calendar view: visual calendar instead of linear list

### Known Issues / Follow-up

- **Facility IDs in fallback list are placeholders** — `src/constants.ts` uses sequential IDs (1–17)
  as a fallback. The live facility list is fetched dynamically from Interbook on startup, so this
  only matters if that request fails.
- **Mock fallback active in devcontainer** — `src/api/bookings.ts` falls back to generated mock
  data when the proxy is unreachable (network `TypeError`). Remove or gate this once deployed
  with a real proxy.

### Out of Scope for v1

- Production deployment / hosting (requires a server-side proxy for CORS)
- Unit tests (structure supports Vitest without changes)
- Email template editing by the user
- Sharing / deep-linking to a specific slot or facility
- Push notifications for slot availability

---

## v2 — Ideas (Not Planned)

These are potential directions, not commitments.

- **Availability alerts:** notify the user when a previously checked slot opens up
- **Slot sharing:** shareable link to a specific day + facility + time

- **Production proxy:** a lightweight Edge Function or Cloudflare Worker to replace the Vite proxy, enabling static deployment
- **More municipalities:** the Interbook system is used by many Swedish municipalities — the facility list and proxy target could be configurable
- **Vitest unit tests:** especially for `schedule.ts` (slot calculation edge cases) and `template.ts`

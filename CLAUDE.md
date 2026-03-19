# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Bundler | Vite |
| Framework | React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| Data fetching | TanStack Query v5 (`useQueries` for parallel facility fetching) |
| State / persistence | `useState` + custom `useLocalStorage` hook |
| Package manager | npm |

---

## Commands

```bash
npm run dev       # Start dev server (required for proxy to work)
npm run build     # TypeScript compile + Vite bundle
npm run preview   # Serve production build locally
npm run lint      # ESLint
```

No test runner is configured yet. `src/lib/schedule.ts` and `src/lib/template.ts` are pure
functions and can be tested with Vitest without any setup.

---

## Architecture Overview

Data flows in one direction:

```
Interbook API (external)
  └─ Vite proxy (/api/bookings → HTTPS rewrite)
       └─ fetchBookings()  [src/api/bookings.ts]
            └─ useQueries()  [App.tsx]  — one query per selected facility, parallel
                 └─ ScheduleGrid  →  DaySection  →  FacilitySlots  →  SlotRow
                                                          ↓ tap "Boka"
                                                     BookingSheet (bottom sheet)
```

**`App.tsx`** owns all state and passes slices down. Nothing else touches localStorage.

**`src/lib/schedule.ts`** — all date/slot logic as pure functions. No React.

**`src/lib/template.ts`** — `applyTemplate()` only. There is no template editor; the
email template is fixed in `constants.ts`. Only contact form values are user-editable.

---

## Key Conventions

**Fetching:** `useQueries` (not `useQuery`) because multiple facilities are selected.
Each query key is `['bookings', facilityId, weekStart.toISOString()]`.
The fetch window is always **14 days** from `weekStart`.

**Day filter:** `'fri-sun'` shows `getDay() ∈ {5, 6, 0}` (Friday, Saturday, Sunday).
`'all'` shows all 14 days. Days with no free slots are **collapsed**, not hidden.

**Event visibility:**
- `type === 'closed'` → never rendered, only used to block free-slot calculation
- `type === 'normal'` + `status === 'booked'` → rendered as training (🏃, gray)
- `type === 'match'` → rendered as match (⚽, orange tint)
- Free slot ≥ `minDuration` minutes → rendered as bookable (green, "Boka" button)

**localStorage keys** (all prefixed `sbf_`):

| Key | Type | Default |
|---|---|---|
| `sbf_facilityIds` | `number[]` | `[2]` |
| `sbf_dayFilter` | `'fri-sun' \| 'all'` | `'fri-sun'` |
| `sbf_minDuration` | `number` | `90` |
| `sbf_form` | `{ lagNamn, ledarNamn, ledarMail, ledarTel }` | empty strings |

`weekStart` is **not persisted** — always resets to Monday of current week on load.

**Mobile-first:** All layout decisions prioritise mobile. `max-w` constraints are loose.
The FacilityPicker opens as a full-screen slide-in sheet (not a dropdown).
The booking flow uses a bottom sheet (not a page section).

---

## Proxy

The Vite proxy in `vite.config.ts` rewrites `/api/bookings` to the Interbook endpoint
and injects required headers (`X-Requested-With`, `Referer`, `Origin`).
This only works during `npm run dev`. Production deployment needs a separate proxy layer.

---

## Roadmap Workflow

Before moving on to the next task in [`ROADMAP.md`](./ROADMAP.md), the current task must be:

1. **Built** — `npm run build` must pass with no errors.
2. **Tested** — manually verify the feature works as expected in the browser (`npm run dev`).

Do not mark a roadmap item complete or start the next one until both steps pass.

---

## Full Technical Spec

See [`SPEC.md`](./SPEC.md) for complete type definitions, component props, API payload
shape, slot calculation algorithm, and Tailwind class conventions.

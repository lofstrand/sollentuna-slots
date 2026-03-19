# Architectural Decisions

Decisions made during planning and their rationale. Intended as a reference for
why things are the way they are — not a to-do list.

---

## ADR-001: Vite dev proxy instead of a backend

**Decision:** Use Vite's built-in proxy to forward requests to the Interbook API.

**Context:** The Interbook API at `sollentuna.interbookfri.se` does not allow cross-origin
requests from a browser. A proper solution would be a backend proxy server.

**Rationale:** For a local-use tool targeting a single municipality's system, a Vite proxy
is sufficient and keeps the project dependency-free on the server side. The limitation
(dev-only) is acceptable for v1.

**Consequence:** The app cannot be deployed as a static site without an additional proxy
layer. Documented as out of scope for v1.

---

## ADR-002: No backend, no auth — localStorage only

**Decision:** All user preferences and contact details are stored in `localStorage`.
There is no login, no account, no server-side storage.

**Context:** The app helps individuals or club managers compose booking request emails.
It does not perform bookings itself — the actual booking is handled by municipal staff
via email.

**Rationale:** Eliminates backend complexity entirely. The data stored (name, email, phone)
is the user's own and low-sensitivity. localStorage survives browser restarts and is
sufficient for the use case.

---

## ADR-003: Multi-facility selection with parallel queries

**Decision:** Users select multiple facilities; each gets its own TanStack Query `useQueries`
entry, all fetched in parallel.

**Context:** The original spec had a single facility selector. Users often want to find
*any* available field, not a specific one.

**Rationale:** Parallel queries with independent cache keys allow each facility's data
to be cached, stale-checked, and retried independently. The UI shows results as they
arrive. Selecting many facilities doesn't block the view.

---

## ADR-004: 14-day window, not 7

**Decision:** Fetch and display 14 days (2 weeks) per query instead of 7.

**Context:** Weekend availability is the primary use case. Showing only one weekend per
view means users have to navigate frequently.

**Rationale:** Two consecutive weekends in one view covers the most common planning
horizon. A single API call per facility covers both weekends. Week navigation shifts
by 7 days so users can slide the window forward.

---

## ADR-005: Default filter is Friday–Sunday, not Saturday–Sunday

**Decision:** `'fri-sun'` (getDay ∈ {5, 6, 0}) is the default day filter.

**Context:** Friday evenings are a common slot for amateur football matches.

**Rationale:** Including Friday by default captures the full practical weekend window
without requiring the user to switch to "Alla dagar".

---

## ADR-006: Collapsed (not hidden) days with no free slots

**Decision:** Days where no selected facility has a free slot of sufficient duration
are shown collapsed — header visible, content hidden — rather than removed entirely.

**Rationale:** Hidden days make users uncertain whether there are no slots or whether
the data hasn't loaded. Collapsed days communicate "we checked, nothing available"
while keeping the timeline readable.

---

## ADR-007: Bottom sheet for booking, not a page section

**Decision:** Tapping "Boka" opens a bottom sheet overlay rather than scrolling to a
form section at the bottom of the page.

**Context:** The app is primarily used on mobile. Scrolling past a schedule to reach
a form breaks spatial context.

**Rationale:** Bottom sheets are a standard mobile pattern for contextual actions.
The schedule stays visible behind the sheet, and the selected slot is prominent at the
top of the sheet.

---

## ADR-008: No email template editor

**Decision:** The email template is fixed in `constants.ts`. Users cannot edit it.
Only contact form values (lag, ledare, mail, telefon) are user-editable and persisted.

**Context:** The original spec included a full template editor with live token validation.

**Rationale:** Template editing is a rarely-needed power-user feature that adds UI
complexity. The fixed Swedish template covers all standard booking requests. If the
template ever needs changing, it's a one-line code edit.

---

## ADR-009: `type === 'closed'` events are invisible

**Decision:** Events with `type: 'closed'` are used only to compute free slot boundaries
and are never rendered as rows in the schedule.

**Rationale:** Closed periods (maintenance, reservations the system blocks out) carry
no actionable information for the user. Showing them adds visual noise. Their effect
on free slots is implicit through the slot calculation.

---

## ADR-010: Facility picker as full-screen slide-in sheet

**Decision:** The facility selector is a button that opens a full-screen (or near-full)
overlay with grouped checkboxes, not an HTML `<select multiple>`.

**Rationale:** HTML multi-select is notoriously poor UX on mobile (iOS/Android native
pickers don't support multi-select well). A custom sheet with grouped checkboxes matches
the app's overall bottom sheet pattern and allows venue grouping with clear visual
hierarchy.

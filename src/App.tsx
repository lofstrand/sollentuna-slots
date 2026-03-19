import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import type { BookingFormState, SelectedSlot } from './types'
import { getToday } from './lib/schedule'
import { useLocalStorage } from './hooks/useLocalStorage'
import { fetchBookings } from './api/bookings'
import { fetchFacilities } from './api/facilities'
import { FACILITIES as FALLBACK_FACILITIES, FETCH_DAYS } from './constants'
import { Header, type ViewMode } from './components/Header'
import { FacilityPicker } from './components/FacilityPicker'
import { ScheduleGrid } from './components/ScheduleGrid'
import { CalendarView } from './components/CalendarView'
import { BookingSheet } from './components/BookingSheet'

const EMPTY_FORM: BookingFormState = {
  lagNamn: '',
  ledarNamn: '',
  ledarMail: '',
  ledarTel: '',
}

export default function App() {
  // Persisted state
  const [facilityIds, setFacilityIds] = useLocalStorage<number[]>('sbf_facilityIds', [2])
  const [dayFilter, setDayFilter] = useLocalStorage<'fri-sun' | 'all'>('sbf_dayFilter', 'fri-sun')
  const [minDuration, setMinDuration] = useLocalStorage<number>('sbf_minDuration', 90)
  const [form, setForm] = useLocalStorage<BookingFormState>('sbf_form', EMPTY_FORM)

  // Dynamic facility list — cached for the whole session, fetched once
  const { data: facilities = FALLBACK_FACILITIES } = useQuery({
    queryKey: ['facilities'],
    queryFn: fetchFacilities,
    staleTime: Infinity,
    retry: false,
  })

  // Ephemeral state
  const [viewDate, setViewDate] = useState<Date>(getToday)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('sbf_viewMode', 'list')
  const [showBooked, setShowBooked] = useLocalStorage<boolean>('sbf_showBooked', false)

  // Derive fetch window from viewMode
  // List: 14 days from viewDate
  // Calendar: full month containing viewDate
  const fetchStart = viewMode === 'calendar'
    ? new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
    : viewDate
  const fetchDays = viewMode === 'calendar'
    ? new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate()
    : FETCH_DAYS

  const queries = useQueries({
    queries: facilityIds.map(id => ({
      queryKey: ['bookings', id, fetchStart.toISOString(), fetchDays] as const,
      queryFn: () => fetchBookings({ resourceId: id, weekStart: fetchStart, days: fetchDays }),
      staleTime: 5 * 60 * 1000,
      retry: 2,
    })),
  })

  function handleNavigate(direction: -1 | 1) {
    setViewDate(prev => {
      const d = new Date(prev)
      if (viewMode === 'calendar') {
        d.setMonth(d.getMonth() + direction)
      } else {
        d.setDate(d.getDate() + direction * FETCH_DAYS)
      }
      return d
    })
  }

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode)
    // When switching to calendar mode, snap to 1st of month
    if (mode === 'calendar') {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth(), 1))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        facilityIds={facilityIds}
        facilities={facilities}
        onOpenFacilityPicker={() => setPickerOpen(true)}
        viewDate={viewDate}
        onNavigate={handleNavigate}
        onViewDateChange={d => setViewDate(d)}
        dayFilter={dayFilter}
        onDayFilterChange={setDayFilter}
        minDuration={minDuration}
        onMinDurationChange={setMinDuration}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        showBooked={showBooked}
        onShowBookedChange={setShowBooked}
      />

      <main className="max-w-2xl lg:max-w-5xl mx-auto">
        {viewMode === 'list' ? (
          <ScheduleGrid
            queries={queries}
            facilityIds={facilityIds}
            facilities={facilities}
            startDate={viewDate}
            dayFilter={dayFilter}
            minDuration={minDuration}
            showBooked={showBooked}
            onBook={setSelectedSlot}
          />
        ) : (
          <CalendarView
            queries={queries}
            facilityIds={facilityIds}
            facilities={facilities}
            viewDate={viewDate}
            dayFilter={dayFilter}
            minDuration={minDuration}
            showBooked={showBooked}
            onBook={setSelectedSlot}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <FacilityPicker
        open={pickerOpen}
        selected={facilityIds}
        facilities={facilities}
        onChange={setFacilityIds}
        onClose={() => setPickerOpen(false)}
      />

      <BookingSheet
        slot={selectedSlot}
        minDuration={minDuration}
        form={form}
        onFormChange={setForm}
        onClose={() => setSelectedSlot(null)}
      />
    </div>
  )
}

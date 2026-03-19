import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { BookingFormState, SelectedSlot } from './types'
import { getToday } from './lib/schedule'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBookings } from './hooks/useBookings'
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
  const [listDayFilter, setListDayFilter] = useLocalStorage<'fri-sun' | 'all'>('sbf_dayFilter', 'fri-sun')
  const [minDuration, setMinDuration] = useLocalStorage<number>('sbf_minDuration', 60)
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
  const [showEmpty, setShowEmpty] = useLocalStorage<boolean>('sbf_showEmpty', true)

  // Centralized booking data — see src/hooks/useBookings.ts
  const { queries, isError, refetch } = useBookings({ facilityIds, viewDate })

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
    if (mode === 'calendar') {
      setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth(), 1))
    } else {
      // When switching to list, clamp to today if viewDate is in the past
      setViewDate(prev => {
        const today = getToday()
        return prev < today ? today : prev
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        facilityIds={facilityIds}
        facilities={facilities}
        onOpenFacilityPicker={() => setPickerOpen(true)}
        minDuration={minDuration}
        onMinDurationChange={setMinDuration}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        showBooked={showBooked}
        onShowBookedChange={setShowBooked}
        showEmpty={showEmpty}
        onShowEmptyChange={setShowEmpty}
      />

      {isError && (
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 pt-3">
          <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <span>Kunde inte hämta tider. Kontrollera din anslutning.</span>
            <button
              onClick={() => refetch()}
              className="shrink-0 font-semibold underline underline-offset-2 hover:text-red-900"
            >
              Försök igen
            </button>
          </div>
        </div>
      )}

      <main className="max-w-2xl lg:max-w-5xl mx-auto">
        {viewMode === 'list' ? (
          <ScheduleGrid
            queries={queries}
            facilityIds={facilityIds}
            facilities={facilities}
            startDate={viewDate}
            dayFilter={listDayFilter}
            minDuration={minDuration}
            showBooked={showBooked}
            showEmpty={showEmpty}
            onBook={setSelectedSlot}
            onNavigate={handleNavigate}
            onDayFilterChange={setListDayFilter}
            onViewDateChange={d => setViewDate(d)}
          />
        ) : (
          <CalendarView
            queries={queries}
            facilityIds={facilityIds}
            facilities={facilities}
            viewDate={viewDate}
            minDuration={minDuration}
            showBooked={showBooked}
            showEmpty={showEmpty}
            onBook={setSelectedSlot}
            onNavigate={handleNavigate}
            onViewDateChange={d => setViewDate(d)}
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

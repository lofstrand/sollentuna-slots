import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Select from '@radix-ui/react-select'
import * as Popover from '@radix-ui/react-popover'
import type { DayFilter, Facility } from '../types'
import { formatMonthLabel, formatListRangeLabel, toDateString } from '../lib/schedule'
import { FETCH_DAYS } from '../constants'
import sfkLogo from '../SFK_logo.svg'

export type ViewMode = 'list' | 'calendar'

interface HeaderProps {
  facilityIds: number[]
  facilities: Facility[]
  onOpenFacilityPicker: () => void
  viewDate: Date
  onNavigate: (direction: -1 | 1) => void
  onViewDateChange: (date: Date) => void
  dayFilter: DayFilter
  onDayFilterChange: (f: DayFilter) => void
  minDuration: number
  onMinDurationChange: (n: number) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  showBooked: boolean
  onShowBookedChange: (v: boolean) => void
}

const MIN_DURATION_OPTIONS = [30, 45, 60, 90, 120]

export function Header({
  facilityIds,
  facilities,
  onOpenFacilityPicker,
  viewDate,
  onNavigate,
  onViewDateChange,
  dayFilter,
  onDayFilterChange,
  minDuration,
  onMinDurationChange,
  viewMode,
  onViewModeChange,
  showBooked,
  onShowBookedChange,
}: HeaderProps) {
  const selectedNames = facilities.filter(f => facilityIds.includes(f.id))
  const facilityLabel =
    selectedNames.length === 0
      ? 'Välj anläggning'
      : selectedNames.length === 1
        ? (selectedNames[0]?.name ?? 'Välj anläggning')
        : `${selectedNames.length} anläggningar`

  const navLabel = viewMode === 'calendar'
    ? formatMonthLabel(viewDate)
    : formatListRangeLabel(viewDate, FETCH_DAYS)

  // For the date input: calendar uses month input, list uses date input
  const inputType = viewMode === 'calendar' ? 'month' : 'date'
  const inputValue = viewMode === 'calendar'
    ? `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`
    : toDateString(viewDate)

  function handleDateInput(raw: string) {
    if (!raw) return
    if (viewMode === 'calendar') {
      const [y, m] = raw.split('-').map(Number)
      if (y && m) onViewDateChange(new Date(y, m - 1, 1))
    } else {
      const d = new Date(raw + 'T00:00:00')
      if (!isNaN(d.getTime())) onViewDateChange(d)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="px-4 pt-3 pb-1">
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <img src={sfkLogo} alt="SFK" className="h-6 w-auto" />
            Slottider Sollentuna
          </h1>
        </div>

        {/* Facility picker button */}
        <div className="px-4 pb-2">
          <button
            onClick={onOpenFacilityPicker}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 active:bg-gray-200"
          >
            <span className="truncate font-medium">{facilityLabel}</span>
            <span className="ml-2 text-gray-400 shrink-0">▼</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          {/* Prev button */}
          <button
            onClick={() => onNavigate(-1)}
            className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200 text-lg"
            aria-label={viewMode === 'calendar' ? 'Föregående månad' : 'Föregående period'}
          >
            ‹
          </button>

          {/* Clickable label → date/month picker popover */}
          <Popover.Root>
            <Popover.Trigger className="shrink-0 text-sm font-semibold text-gray-700 min-w-[110px] text-center px-2 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors">
              {navLabel}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={6}
                className="z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-4 focus:outline-none"
              >
                <p className="text-xs font-medium text-gray-500 mb-2">
                  {viewMode === 'calendar' ? 'Hoppa till månad' : 'Hoppa till datum'}
                </p>
                <input
                  type={inputType}
                  defaultValue={inputValue}
                  key={inputValue}
                  onChange={e => handleDateInput(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <Popover.Arrow className="fill-white drop-shadow-sm" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>

          {/* Next button */}
          <button
            onClick={() => onNavigate(1)}
            className="shrink-0 w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center active:bg-gray-200 text-lg"
            aria-label={viewMode === 'calendar' ? 'Nästa månad' : 'Nästa period'}
          >
            ›
          </button>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Day filter */}
          <ToggleGroup.Root
            type="single"
            value={dayFilter}
            onValueChange={v => { if (v) onDayFilterChange(v as DayFilter) }}
            className="flex shrink-0 bg-gray-100 rounded-lg p-0.5 text-xs font-medium"
          >
            <ToggleGroup.Item
              value="fri-sun"
              className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm text-gray-500"
            >
              Fre–Sön
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="all"
              className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm text-gray-500"
            >
              Alla
            </ToggleGroup.Item>
          </ToggleGroup.Root>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Min duration */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs text-gray-500">Min</span>
            <Select.Root
              value={String(minDuration)}
              onValueChange={v => onMinDurationChange(Number(v))}
            >
              <Select.Trigger className="flex items-center gap-1 text-xs bg-gray-100 rounded-lg py-1.5 px-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400">
                <Select.Value />
                <Select.Icon className="text-gray-400 text-[10px]">▼</Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={4}
                  className="z-50 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden"
                >
                  <Select.Viewport className="p-1">
                    {MIN_DURATION_OPTIONS.map(n => {
                      const h = Math.floor(n / 60)
                      const m = n % 60
                      const label = h > 0 && m > 0 ? `${h} h ${m} min` : h > 0 ? `${h} h` : `${m} min`
                      return (
                        <Select.Item
                          key={n}
                          value={String(n)}
                          className="text-xs text-gray-700 px-3 py-1.5 rounded-md cursor-pointer select-none
                            data-[highlighted]:bg-blue-50 data-[highlighted]:text-blue-700
                            data-[state=checked]:font-semibold focus:outline-none"
                        >
                          <Select.ItemText>{label}</Select.ItemText>
                        </Select.Item>
                      )
                    })}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* Show booked toggle */}
          <button
            onClick={() => onShowBookedChange(!showBooked)}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showBooked ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span>🏃</span>
            <span>{showBooked ? 'Dölj bokade' : 'Visa bokade'}</span>
          </button>

          <div className="w-px h-5 bg-gray-200 shrink-0" />

          {/* View mode */}
          <ToggleGroup.Root
            type="single"
            value={viewMode}
            onValueChange={v => { if (v) onViewModeChange(v as ViewMode) }}
            className="flex shrink-0 bg-gray-100 rounded-lg p-0.5 text-xs font-medium"
          >
            <ToggleGroup.Item
              value="list"
              aria-label="Listvy"
              className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:shadow-sm text-gray-500"
            >
              ☰
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="calendar"
              aria-label="Kalendervy"
              className="px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:shadow-sm text-gray-500"
            >
              📅
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
      </div>
    </header>
  )
}

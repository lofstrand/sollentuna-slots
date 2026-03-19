import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Select from '@radix-ui/react-select'
import type { Facility } from '../types'
import sfkLogo from '../SFK_logo.svg'

export type ViewMode = 'list' | 'calendar'

interface HeaderProps {
  facilityIds: number[]
  facilities: Facility[]
  onOpenFacilityPicker: () => void
  minDuration: number
  onMinDurationChange: (n: number) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  showBooked: boolean
  onShowBookedChange: (v: boolean) => void
  showEmpty: boolean
  onShowEmptyChange: (v: boolean) => void
}

const MIN_DURATION_OPTIONS = [60, 90, 120]

export function Header({
  facilityIds,
  facilities,
  onOpenFacilityPicker,
  minDuration,
  onMinDurationChange,
  viewMode,
  onViewModeChange,
  showBooked,
  onShowBookedChange,
  showEmpty,
  onShowEmptyChange,
}: HeaderProps) {
  const selectedNames = facilities.filter(f => facilityIds.includes(f.id))
  const facilityLabel =
    selectedNames.length === 0
      ? 'Välj anläggning'
      : selectedNames.length === 1
        ? (selectedNames[0]?.name ?? 'Välj anläggning')
        : `${selectedNames.length} anläggningar`

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-2xl lg:max-w-5xl mx-auto">
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
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">

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
            <span aria-hidden="true">🏃</span>
            <span>{showBooked ? 'Dölj bokade' : 'Visa bokade'}</span>
          </button>

          {/* Show empty facilities toggle */}
          <button
            onClick={() => onShowEmptyChange(!showEmpty)}
            className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !showEmpty ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {showEmpty ? 'Dölj utan tider' : 'Visa utan tider'}
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:shadow-sm text-gray-500"
            >
              <span aria-hidden="true">☰</span>
              <span>Lista</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="calendar"
              aria-label="Kalendervy"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors data-[state=on]:bg-white data-[state=on]:shadow-sm text-gray-500"
            >
              <span aria-hidden="true">📅</span>
              <span>Kalender</span>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
      </div>
    </header>
  )
}

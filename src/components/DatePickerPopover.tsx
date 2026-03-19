import { useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { getMonthDates, formatMonthLabel, toDateString, getToday } from '../lib/schedule'

const DAY_HEADERS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

interface DatePickerPopoverProps {
  selected: Date
  days?: number  // if set, highlights a range of this many days starting from selected
  onSelect: (date: Date) => void
  trigger: React.ReactNode
}

export function DatePickerPopover({ selected, days, onSelect, trigger }: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthDates = getMonthDates(year, month)
  const todayStr = toDateString(getToday())
  const selectedStr = toDateString(selected)

  // Compute range end for week-range highlighting
  const rangeEnd = days != null ? new Date(selected.getTime() + (days - 1) * 86400000) : null
  const rangeEndStr = rangeEnd ? toDateString(rangeEnd) : null

  const leadingNulls = mondayIndex(monthDates[0]!)
  const cells: (Date | null)[] = [...Array<null>(leadingNulls).fill(null), ...monthDates]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  function navigate(dir: -1 | 1) {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
  }

  function handleSelect(date: Date) {
    onSelect(date)
    setOpen(false)
  }

  function inRange(dateStr: string): boolean {
    if (!rangeEndStr) return false
    return dateStr > selectedStr && dateStr <= rangeEndStr
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden focus:outline-none"
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
            <button
              onClick={() => navigate(-1)}
              className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 text-lg leading-none"
              aria-label="Föregående månad"
            >‹</button>
            <span className="text-sm font-semibold text-gray-700 capitalize">{formatMonthLabel(viewDate)}</span>
            <button
              onClick={() => navigate(1)}
              className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 active:bg-gray-300 text-lg leading-none"
              aria-label="Nästa månad"
            >›</button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {DAY_HEADERS.map(d => (
              <div key={d} className="pb-1 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Week rows */}
          <div className="px-2 pb-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((date, di) => {
                  if (!date) return <div key={di} className="aspect-square" />
                  const dateStr = toDateString(date)
                  const isToday = dateStr === todayStr
                  const isStart = dateStr === selectedStr
                  const isInRange = inRange(dateStr)
                  const isEnd = dateStr === rangeEndStr

                  // Range highlight strip — spans the full cell width, centered vertically
                  const stripClass = isInRange || isEnd
                    ? `absolute inset-y-0.5 ${isEnd ? 'right-1/2 left-0' : 'inset-x-0'} bg-blue-100`
                    : isStart && rangeEndStr
                      ? 'absolute inset-y-0.5 left-1/2 right-0 bg-blue-100'
                      : ''

                  return (
                    <div key={di} className="relative flex items-center justify-center p-0.5">
                      {stripClass && <div className={stripClass} />}
                      <button
                        onClick={() => handleSelect(date)}
                        className={`relative z-10 w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                          ${isStart ? 'bg-blue-600 text-white' : ''}
                          ${isEnd ? 'bg-blue-500 text-white' : ''}
                          ${isInRange ? 'text-blue-700 hover:bg-blue-200' : ''}
                          ${isToday && !isStart && !isEnd ? 'ring-2 ring-blue-500 text-blue-600' : ''}
                          ${!isStart && !isEnd && !isInRange && !isToday ? 'text-gray-800 hover:bg-gray-100 active:bg-gray-200' : ''}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

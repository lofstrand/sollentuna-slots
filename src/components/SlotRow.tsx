import { minToTime } from '../lib/schedule'

interface SlotRowProps {
  type: 'free' | 'training' | 'match'
  startMin: number
  endMin: number
  description?: string
  onBook?: () => void
}

const STYLES = {
  free:     'bg-green-50 border-l-4 border-green-400 text-green-900',
  training: 'bg-gray-50 text-gray-600',
  match:    'bg-orange-50 border-l-4 border-orange-300 text-orange-900',
}

const ICONS = {
  free:     '🟢',
  training: '🏃',
  match:    '⚽',
}

export function SlotRow({ type, startMin, endMin, description, onBook }: SlotRowProps) {
  const duration = endMin - startMin
  const hours = Math.floor(duration / 60)
  const mins = duration % 60
  const durationLabel = mins === 0 ? `${hours} h` : `${hours} h ${mins} min`

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded ${STYLES[type]}`}>
      <span className="text-base leading-none">{ICONS[type]}</span>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm">
          {minToTime(startMin)}–{minToTime(endMin)}
        </span>
        {type === 'free' && (
          <span className="ml-2 text-xs text-green-700">{durationLabel} ledig</span>
        )}
        {description && (
          <p className="text-xs truncate mt-0.5 opacity-75">{description}</p>
        )}
      </div>
      {type === 'free' && onBook && (
        <button
          onClick={onBook}
          className="shrink-0 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg active:bg-green-700"
        >
          Boka
        </button>
      )}
    </div>
  )
}

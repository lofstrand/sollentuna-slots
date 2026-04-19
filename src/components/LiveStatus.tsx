import { useState, useEffect, useRef } from 'react'

interface LiveStatusProps {
  isLoading: boolean
}

export function LiveStatus({ isLoading }: LiveStatusProps) {
  const [visible, setVisible] = useState(false)
  const [time, setTime] = useState('')
  const wasLoading = useRef(false)

  useEffect(() => {
    if (isLoading) {
      wasLoading.current = true
    } else if (wasLoading.current) {
      wasLoading.current = false
      setTime(formatTime(new Date()))
      setVisible(true)
      const id = setTimeout(() => setVisible(false), 3000)
      return () => clearTimeout(id)
    }
  }, [isLoading])

  if (!visible && !isLoading) return null

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-500 ${
      visible || isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      {isLoading ? (
        <div className="bg-surface-container-low rounded-full px-4 py-2 shadow-sm border border-outline-variant/10 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-sm animate-spin">sync</span>
          <span className="text-on-surface-variant font-body text-[11px] uppercase tracking-widest">Uppdaterar...</span>
        </div>
      ) : (
        <div className="bg-surface-tint/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10">
          <span className="material-symbols-outlined text-white/80 text-sm">check_circle</span>
          <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap font-body">
            Uppdaterad {time}
          </span>
        </div>
      )}
    </div>
  )
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

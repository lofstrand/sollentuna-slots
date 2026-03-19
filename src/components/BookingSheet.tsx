import { useRef, useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import * as Slider from '@radix-ui/react-slider'
import type { BookingFormState, SelectedSlot } from '../types'
import { minToTime } from '../lib/schedule'
import { applyTemplate } from '../lib/template'
import { EMAIL_TEMPLATE, BOOKING_EMAIL, BOOKING_EMAIL_SUBJECT, MIN_BOOKING_DURATION } from '../constants'

interface BookingSheetProps {
  slot: SelectedSlot | null
  minDuration: number
  form: BookingFormState
  onFormChange: (form: BookingFormState) => void
  onClose: () => void
}

const STEP = 15 // minutes

/** Parse "HH:MM" to minutes, returns null if invalid */
function parseTime(val: string): number | null {
  const m = val.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** Round to nearest 15-min step */
function snap(val: number): number {
  return Math.round(val / STEP) * STEP
}

export function BookingSheet({ slot, minDuration, form, onFormChange, onClose }: BookingSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [bookStart, setBookStart] = useState(0)
  const [bookEnd, setBookEnd]     = useState(0)

  // Reset whenever a new slot opens
  useEffect(() => {
    if (slot) {
      const start = snap(slot.startMin)
      const end   = snap(Math.min(slot.startMin + minDuration, slot.endMin))
      setBookStart(start)
      setBookEnd(end)
    }
  }, [slot, minDuration])  // minDuration used only for the initial default end time

  const isOpen = slot !== null

  // Derived values — safe to use only when slot is non-null (guarded in render below)
  const slotStart = slot ? snap(slot.startMin) : 0
  const slotEnd   = slot ? snap(slot.endMin)   : 0

  // Keep values valid
  const safeStart = Math.max(slotStart, Math.min(bookStart, slotEnd - STEP))
  const safeEnd   = Math.max(safeStart + STEP, Math.min(bookEnd, slotEnd))

  function handleSlider([s, e]: number[]) {
    // Enforce minDuration — if thumbs would be too close, push the other one
    if (e! - s! < MIN_BOOKING_DURATION) {
      // Decide which thumb moved by comparing distance
      if (Math.abs(s! - safeStart) > Math.abs(e! - safeEnd)) {
        // end thumb moved
        setBookEnd(Math.min(slotEnd, s! + MIN_BOOKING_DURATION))
        setBookStart(s!)
      } else {
        // start thumb moved
        setBookStart(Math.max(slotStart, e! - MIN_BOOKING_DURATION))
        setBookEnd(e!)
      }
    } else {
      setBookStart(s!)
      setBookEnd(e!)
    }
  }

  function handleStartInput(raw: string) {
    const val = parseTime(raw)
    if (val === null) return
    const clamped = snap(Math.max(slotStart, Math.min(val, safeEnd - MIN_BOOKING_DURATION)))
    setBookStart(clamped)
  }

  function handleEndInput(raw: string) {
    const val = parseTime(raw)
    if (val === null) return
    const clamped = snap(Math.min(slotEnd, Math.max(val, safeStart + MIN_BOOKING_DURATION)))
    setBookEnd(clamped)
  }

  const duration    = safeEnd - safeStart
  const durationH   = Math.floor(duration / 60)
  const durationM   = duration % 60
  const durationLabel = [durationH > 0 && `${durationH} h`, durationM > 0 && `${durationM} min`]
    .filter(Boolean).join(' ')

  const onskadTid = slot ? `${slot.facilityName}, ${slot.date}, ${minToTime(safeStart)}–${minToTime(safeEnd)}` : ''

  const emailBody = applyTemplate(EMAIL_TEMPLATE, {
    lagNamn:   form.lagNamn,
    ledarNamn: form.ledarNamn,
    ledarMail: form.ledarMail,
    ledarTel:  form.ledarTel,
    onskadTid,
  })

  const mailtoHref = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(BOOKING_EMAIL_SUBJECT)}&body=${encodeURIComponent(emailBody)}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emailBody)
      alert('Kopierat!')
    } catch {
      if (textareaRef.current) {
        textareaRef.current.select()
        document.execCommand('copy')
        alert('Kopierat!')
      }
    }
  }

  function update(field: keyof BookingFormState, value: string) {
    onFormChange({ ...form, [field]: value })
  }

  if (!isOpen || !slot) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={v => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[92vh] flex flex-col shadow-2xl focus:outline-none"
          aria-describedby={undefined}
        >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Slot info */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-bold text-gray-900">{slot.facilityName}</Dialog.Title>
              <p className="text-sm text-gray-500 mt-0.5">{slot.date}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Tillgänglig {minToTime(slot.startMin)}–{minToTime(slot.endMin)}
              </p>
            </div>
            <Dialog.Close className="text-gray-400 text-xl px-1" aria-label="Stäng">
              ✕
            </Dialog.Close>
          </div>
        </div>

        {/* Scrollable form + preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Time range picker */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-4">Önskad tid</h3>

            {/* Editable time inputs */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Från</label>
                <input
                  type="time"
                  defaultValue={minToTime(safeStart)}
                  key={`start-${safeStart}`}
                  onBlur={e => handleStartInput(e.target.value)}
                  onChange={e => handleStartInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <span className="text-gray-400 mt-5">–</span>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Till</label>
                <input
                  type="time"
                  defaultValue={minToTime(safeEnd)}
                  key={`end-${safeEnd}`}
                  onBlur={e => handleEndInput(e.target.value)}
                  onChange={e => handleEndInput(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <span className="text-xs text-gray-400 mt-5 shrink-0">{durationLabel}</span>
            </div>

            {/* Range slider */}
            <Slider.Root
              min={slotStart}
              max={slotEnd}
              step={STEP}
              value={[safeStart, safeEnd]}
              onValueChange={handleSlider}
              className="relative flex items-center w-full touch-none select-none h-10"
            >
              <Slider.Track className="relative bg-gray-200 rounded-full flex-1 h-2">
                <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-6 h-6 bg-white border-2 border-green-500 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                aria-label="Starttid"
              />
              <Slider.Thumb
                className="block w-6 h-6 bg-white border-2 border-green-500 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                aria-label="Sluttid"
              />
            </Slider.Root>

            {/* Slot boundary labels */}
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{minToTime(slotStart)}</span>
              <span>{minToTime(slotEnd)}</span>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          <h3 className="font-semibold text-gray-800">Kontaktuppgifter</h3>
          <div className="space-y-3">
            <Field
              label="Lag / förening"
              value={form.lagNamn}
              placeholder="P2016 Norrviken / Sollentuna FK"
              onChange={v => update('lagNamn', v)}
            />
            <Field
              label="Ledare"
              value={form.ledarNamn}
              placeholder="Förnamn Efternamn"
              onChange={v => update('ledarNamn', v)}
            />
            <Field
              label="E-post"
              value={form.ledarMail}
              placeholder="ledare@example.com"
              type="email"
              onChange={v => update('ledarMail', v)}
            />
            <Field
              label="Telefon"
              value={form.ledarTel}
              placeholder="070-000 00 00"
              type="tel"
              onChange={v => update('ledarTel', v)}
            />
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Förhandsgranskning</h3>
            <textarea
              ref={textareaRef}
              readOnly
              value={emailBody}
              rows={10}
              className="w-full text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 resize-none"
            />
          </div>
        </div>

        {/* CTAs */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <a
            href={mailtoHref}
            className="flex-1 bg-blue-600 text-white text-sm font-semibold py-3 rounded-xl text-center active:bg-blue-700"
          >
            Öppna i mailklient
          </a>
          <button
            onClick={handleCopy}
            className="flex-1 bg-gray-100 text-gray-700 text-sm font-semibold py-3 rounded-xl active:bg-gray-200"
          >
            Kopiera text
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

interface FieldProps {
  label: string
  value: string
  placeholder: string
  type?: string
  onChange: (value: string) => void
}

function Field({ label, value, placeholder, type = 'text', onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 bg-white placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  )
}

import { useRef, useState, useEffect, useMemo } from "react";
import * as Slider from "@radix-ui/react-slider";
import type { BookingFormState, SelectedSlot } from "../types";
import { minToTime } from "../lib/schedule";
import { applyTemplate } from "../lib/template";
import {
  EMAIL_TEMPLATE,
  BOOKING_EMAIL,
  BOOKING_EMAIL_SUBJECT,
  MIN_BOOKING_DURATION,
} from "../constants";

interface BookingSheetProps {
  slot: SelectedSlot | null;
  minDuration: number;
  form: BookingFormState;
  onFormChange: (form: BookingFormState) => void;
  onClose: () => void;
}

const STEP = 15; // minutes
const DAYS_SV = [
  "Söndag",
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lördag",
];
const MONTHS_SV = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

function parseTime(val: string): number | null {
  const m = val.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function snap(val: number): number {
  return Math.round(val / STEP) * STEP;
}

export function BookingSheet({
  slot,
  minDuration,
  form,
  onFormChange,
  onClose,
}: BookingSheetProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [bookStart, setBookStart] = useState(0);
  const [bookEnd, setBookEnd] = useState(0);
  const [timeExpanded, setTimeExpanded] = useState(() => window.innerWidth >= 1024);

  const availableSlots = useMemo(() => slot?.availableSlots ?? [], [slot]);
  const activeSlot = availableSlots[selectedSlotIdx] ?? { startMin: slot?.startMin ?? 0, endMin: slot?.endMin ?? 0 };

  useEffect(() => {
    if (slot) {
      setSelectedSlotIdx(0);
      setTimeExpanded(window.innerWidth >= 1024);
    }
  }, [slot]);

  useEffect(() => {
    const s = availableSlots[selectedSlotIdx];
    if (s) {
      const start = snap(s.startMin);
      const end = snap(Math.min(s.startMin + minDuration, s.endMin));
      setBookStart(start);
      setBookEnd(end);
    }
  }, [selectedSlotIdx, slot, minDuration, availableSlots]);

  const slotStart = snap(activeSlot.startMin);
  const slotEnd = snap(activeSlot.endMin);

  const safeStart = Math.max(slotStart, Math.min(bookStart, slotEnd - MIN_BOOKING_DURATION));
  const safeEnd = Math.max(safeStart + MIN_BOOKING_DURATION, Math.min(bookEnd, slotEnd));

  function handleSlider([s, e]: [number, number]) {
    if (e - s < MIN_BOOKING_DURATION) {
      if (Math.abs(s - safeStart) > Math.abs(e - safeEnd)) {
        setBookEnd(Math.min(slotEnd, s + MIN_BOOKING_DURATION));
        setBookStart(s);
      } else {
        setBookStart(Math.max(slotStart, e - MIN_BOOKING_DURATION));
        setBookEnd(e);
      }
    } else {
      setBookStart(s);
      setBookEnd(e);
    }
  }

  function handleStartInput(raw: string) {
    const val = parseTime(raw);
    if (val === null) return;
    const clamped = snap(
      Math.max(slotStart, Math.min(val, safeEnd - MIN_BOOKING_DURATION)),
    );
    setBookStart(clamped);
  }

  function handleEndInput(raw: string) {
    const val = parseTime(raw);
    if (val === null) return;
    const clamped = snap(
      Math.min(slotEnd, Math.max(val, safeStart + MIN_BOOKING_DURATION)),
    );
    setBookEnd(clamped);
  }

  const duration = safeEnd - safeStart;
  const durationH = Math.floor(duration / 60);
  const durationM = duration % 60;
  const durationLabel = [
    durationH > 0 && `${durationH}h`,
    durationM > 0 && `${durationM}m`,
  ]
    .filter(Boolean)
    .join(" ");

  const slotDate = slot ? new Date(slot.date + "T00:00:00") : null;

  const emailBody = applyTemplate(EMAIL_TEMPLATE, {
    lagNamn: form.lagNamn,
    ledarNamn: form.ledarNamn,
    ledarMail: form.ledarMail,
    ledarTel: form.ledarTel,
    bokningsTyp: form.bokningsTyp,
    plan: slot?.facilityName ?? '',
    datum: slot?.date ?? '',
    tid: slot ? `${minToTime(safeStart)}–${minToTime(safeEnd)}` : '',
  });

  const mailtoHref = `mailto:${BOOKING_EMAIL}?subject=${encodeURIComponent(BOOKING_EMAIL_SUBJECT)}&body=${encodeURIComponent(emailBody)}`;

  const formValid = !!(
    form.lagNamn &&
    form.ledarNamn &&
    form.ledarMail &&
    form.ledarTel
  );

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(emailBody);
    } catch {
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand("copy");
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function update(field: keyof BookingFormState, value: string) {
    onFormChange({ ...form, [field]: value });
  }

  if (!slot) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col">
      {/* Top bar with back button */}
      <header className="shrink-0 flex items-center gap-3 px-4 h-14 bg-surface/90 backdrop-blur-xl shadow-ambient">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-primary active:opacity-70"
          aria-label="Tillbaka"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h1 className="font-display font-bold text-on-surface truncate">
          {slot.facilityName}
        </h1>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-5 pt-6">
          {/* Privacy notice — full width */}
          <div className="flex items-center gap-3 bg-surface-container-low border border-primary/20 rounded-xl px-4 py-3">
            <span className="material-symbols-outlined text-primary text-xl">shield</span>
            <p className="text-label-md text-on-surface-variant font-body">
              Ingen data lagras på våra servrar.
            </p>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-5 pb-6 lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:items-start">
        <div className="space-y-6 mt-6">
          {/* Contact details */}
          <section>
            <h2 className="font-display text-headline-sm text-on-surface mb-4">
              Sökandes Uppgifter
            </h2>
            <div className="space-y-4">
              <Field
                label="Lag / Förening"
                value={form.lagNamn}
                placeholder="Sollentuna FK"
                onChange={(v) => update("lagNamn", v)}
              />
              <Field
                label="Fullständigt Namn"
                value={form.ledarNamn}
                placeholder="Erik Andersson"
                onChange={(v) => update("ledarNamn", v)}
              />
              <Field
                label="E-postadress"
                value={form.ledarMail}
                placeholder="erik@club.se"
                type="email"
                onChange={(v) => update("ledarMail", v)}
              />
              <Field
                label="Telefon"
                value={form.ledarTel}
                placeholder="070-123 45 67"
                type="tel"
                onChange={(v) => update("ledarTel", v)}
              />
            </div>
          </section>

          {/* Booking type */}
          <section>
            <h2 className="font-display text-headline-sm text-on-surface mb-4">
              Typ av bokning
            </h2>
            <div className="flex gap-2">
              {([
                { type: 'match', label: 'Match', icon: 'scoreboard' },
                { type: 'träning', label: 'Träning', icon: 'sports_soccer' },
              ] as const).map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => update('bokningsTyp', type)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-label-md font-body font-semibold transition-colors ${
                    form.bokningsTyp === type
                      ? 'bg-gradient-to-b from-primary to-primary-container text-white'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-base leading-none">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Time selection */}
          <section>
            <h2 className="font-display text-headline-sm text-on-surface mb-4">
              Önskad Tid
            </h2>

            {/* Slot picker — choose which time window */}
            {availableSlots.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {availableSlots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedSlotIdx(i); setTimeExpanded(window.innerWidth >= 1024) }}
                    className={`px-3 py-2 rounded-lg text-label-md font-body font-semibold transition-colors ${
                      i === selectedSlotIdx
                        ? 'bg-primary text-white'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {minToTime(s.startMin)} — {minToTime(s.endMin)}
                  </button>
                ))}
              </div>
            )}

            {/* Green date/time card — tappable to expand fine-tuning */}
            <button
              onClick={() => setTimeExpanded(!timeExpanded)}
              className="w-full bg-gradient-to-b from-primary to-primary-container rounded-xl px-4 py-3 flex items-center justify-between text-left active:opacity-95 transition-opacity"
            >
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-white/80 text-base">
                  calendar_today
                </span>
                <div>
                  <p className="text-white/80 text-label-sm font-body">
                    {slotDate
                      ? `${DAYS_SV[slotDate.getDay()]} ${slotDate.getDate()} ${MONTHS_SV[slotDate.getMonth()]}`
                      : ""}
                  </p>
                  <p className="text-white font-display font-bold text-base leading-tight">
                    {minToTime(safeStart)} - {minToTime(safeEnd)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/20 text-white font-bold text-label-sm rounded-full px-2 py-0.5 font-body">
                  {durationLabel}
                </span>
                <span className={`material-symbols-outlined text-white/70 text-base transition-transform ${timeExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </div>
            </button>

            {/* Expandable time editor */}
            {timeExpanded && (
              <div className="mt-4 space-y-4 animate-in">
                {/* Time inputs */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-label-sm text-on-surface-variant font-body uppercase tracking-wider mb-1 block">
                      Start
                    </span>
                    <input
                      type="time"
                      defaultValue={minToTime(safeStart)}
                      key={`start-${safeStart}`}
                      onBlur={(e) => handleStartInput(e.target.value)}
                      onChange={(e) => handleStartInput(e.target.value)}
                      className="w-full text-center py-3 text-label-lg font-body text-on-surface bg-surface-container-low rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <span className="text-on-surface-variant text-lg pt-5">
                    —
                  </span>
                  <div className="flex-1">
                    <span className="text-label-sm text-on-surface-variant font-body uppercase tracking-wider mb-1 block">
                      Slut
                    </span>
                    <input
                      type="time"
                      defaultValue={minToTime(safeEnd)}
                      key={`end-${safeEnd}`}
                      onBlur={(e) => handleEndInput(e.target.value)}
                      onChange={(e) => handleEndInput(e.target.value)}
                      className="w-full text-center py-3 text-label-lg font-body text-on-surface bg-surface-container-low rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Slider */}
                <Slider.Root
                  min={slotStart}
                  max={slotEnd}
                  step={STEP}
                  value={[safeStart, safeEnd]}
                  onValueChange={handleSlider}
                  className="relative flex items-center w-full touch-none select-none h-10"
                >
                  <Slider.Track className="relative bg-surface-container-high rounded-full flex-1 h-2">
                    <Slider.Range className="absolute bg-gradient-to-r from-primary to-primary-container rounded-full h-full" />
                  </Slider.Track>
                  <Slider.Thumb
                    className="block w-6 h-6 bg-surface-container-lowest border-2 border-primary rounded-full shadow-ambient focus:outline-none focus:ring-2 focus:ring-primary-fixed focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                    aria-label="Starttid"
                  />
                  <Slider.Thumb
                    className="block w-6 h-6 bg-surface-container-lowest border-2 border-primary rounded-full shadow-ambient focus:outline-none focus:ring-2 focus:ring-primary-fixed focus:ring-offset-2 cursor-grab active:cursor-grabbing"
                    aria-label="Sluttid"
                  />
                </Slider.Root>
                <div className="flex justify-between text-label-sm text-on-surface-variant font-body">
                  <span>{minToTime(slotStart)}</span>
                  <span>{minToTime(slotEnd)}</span>
                </div>
              </div>
            )}
          </section>

        </div>

          {/* Preview — right column on desktop, inline on mobile */}
          <section className="mt-6 lg:sticky lg:top-6 flex flex-col gap-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-headline-sm text-on-surface">
                Förhandsgranskning
              </h2>
              <button
                onClick={formValid ? handleCopy : undefined}
                disabled={!formValid}
                className={`flex items-center gap-1.5 text-label-sm font-body font-semibold rounded-lg px-2.5 py-1.5 transition-colors ${
                  formValid
                    ? 'text-primary hover:bg-primary/10 active:bg-primary/15'
                    : 'text-on-surface-variant opacity-40 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-base leading-none">content_copy</span>
                {copied ? 'Kopierat ✓' : 'Kopiera'}
              </button>
            </div>
            <div className="bg-surface-container-low rounded-xl p-4">
              <textarea
                ref={textareaRef}
                readOnly
                value={emailBody}
                rows={emailBody.split('\n').length + 1}
                className="w-full text-label-sm font-mono text-on-surface-variant bg-transparent resize-none cursor-default"
              />
            </div>
            {/* Send button — inside preview column on desktop */}
            <a
              href={formValid ? mailtoHref : undefined}
              onClick={!formValid ? (e) => e.preventDefault() : undefined}
              className={`hidden lg:flex items-center justify-center gap-2 text-label-md font-bold py-3 rounded-xl text-center transition-all font-body ${
                formValid
                  ? "bg-gradient-to-b from-primary to-primary-container text-white active:opacity-90 shadow-lg shadow-primary/20"
                  : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
              }`}
            >
              <span className="material-symbols-outlined text-lg">mail</span>
              Skicka bokningsförfrågan
            </a>
          </section>
        </div>
      </main>

      {/* Sticky CTA — mobile only */}
      <div
        className="lg:hidden shrink-0 px-5 py-4 bg-surface space-y-3"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <a
          href={formValid ? mailtoHref : undefined}
          onClick={!formValid ? (e) => e.preventDefault() : undefined}
          className={`flex items-center justify-center gap-2 w-full text-label-lg font-bold py-3.5 rounded-xl text-center transition-all font-body ${
            formValid
              ? "bg-gradient-to-b from-primary to-primary-container text-white active:opacity-90 shadow-lg shadow-primary/20"
              : "bg-surface-container-highest text-on-surface-variant cursor-not-allowed"
          }`}
        >
          <span className="material-symbols-outlined text-lg">mail</span>
          Skicka bokningsförfrågan
        </a>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}

function Field({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: FieldProps) {
  return (
    <div>
      <label className="block text-label-sm font-semibold text-on-surface-variant mb-1.5 font-body uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-container-lowest rounded-md px-4 py-3 text-label-lg font-body text-on-surface placeholder:text-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-ambient"
      />
    </div>
  );
}

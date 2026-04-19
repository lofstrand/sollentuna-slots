import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Select from "@radix-ui/react-select";
import type { Facility } from "../types";
import sfkLogo from "../SFK_logo.svg";

export type ViewMode = "list" | "calendar";

interface HeaderProps {
  facilityIds: number[];
  facilities: Facility[];
  onOpenFacilityPicker: () => void;
  minDuration: number;
  onMinDurationChange: (n: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  showBooked: boolean;
  onShowBookedChange: (v: boolean) => void;
  showEmpty: boolean;
  onShowEmptyChange: (v: boolean) => void;
}

const MIN_DURATION_OPTIONS = [60, 90, 120];

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
  const selectedNames = facilities.filter((f) => facilityIds.includes(f.id));
  const facilityLabel =
    selectedNames.length === 0
      ? "Välj anläggning"
      : selectedNames.length === 1
        ? (selectedNames[0]?.name ?? "Välj anläggning")
        : `${selectedNames.length} anläggningar`;

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl shadow-ambient">
      <div className="max-w-2xl lg:max-w-5xl mx-auto">
        {/* Title */}
        <div className="px-4 pt-4 pb-1">
          <h1 className="font-display text-headline-sm text-on-surface flex items-center gap-2.5">
            <img src={sfkLogo} alt="SFK" className="h-6 w-auto" />
            Slottider Sollentuna
          </h1>
        </div>

        {/* Facility picker button */}
        <div className="px-4 pb-2">
          <button
            onClick={onOpenFacilityPicker}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-container rounded-md text-label-md font-body text-on-surface active:bg-surface-container-high transition-colors"
          >
            <span className="truncate font-semibold">{facilityLabel}</span>
            <span className="ml-2 text-on-surface-variant shrink-0 text-xs">
              ▼
            </span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
          {/* Min duration */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-label-sm text-on-surface-variant font-body">
              Min
            </span>
            <Select.Root
              value={String(minDuration)}
              onValueChange={(v) => onMinDurationChange(Number(v))}
            >
              <Select.Trigger className="flex items-center gap-1 text-label-sm bg-surface-container rounded-md py-1.5 px-2.5 text-on-surface font-semibold font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                <Select.Value />
                <Select.Icon className="text-on-surface-variant text-[10px]">
                  ▼
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={4}
                  className="z-50 bg-surface-container-lowest rounded-md shadow-ambient-lg overflow-hidden"
                >
                  <Select.Viewport className="p-1">
                    {MIN_DURATION_OPTIONS.map((n) => {
                      const h = Math.floor(n / 60);
                      const m = n % 60;
                      const label =
                        h > 0 && m > 0
                          ? `${h} h ${m} min`
                          : h > 0
                            ? `${h} h`
                            : `${m} min`;
                      return (
                        <Select.Item
                          key={n}
                          value={String(n)}
                          className="text-label-sm font-body text-on-surface px-3 py-1.5 rounded-[0.5rem] cursor-pointer select-none
                            data-[highlighted]:bg-surface-tint data-[highlighted]:text-primary
                            data-[state=checked]:font-bold focus:outline-none"
                        >
                          <Select.ItemText>{label}</Select.ItemText>
                        </Select.Item>
                      );
                    })}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Show booked toggle */}
          <button
            onClick={() => onShowBookedChange(!showBooked)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-semibold font-body transition-colors ${
              showBooked
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={
                showBooked ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {showBooked ? "check_box" : "check_box_outline_blank"}
            </span>
            <span>Bokningar</span>
          </button>

          {/* Show fully booked facilities toggle */}
          <button
            onClick={() => onShowEmptyChange(!showEmpty)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-label-sm font-semibold font-body transition-colors ${
              showEmpty
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined text-sm"
              style={
                showEmpty ? { fontVariationSettings: "'FILL' 1" } : undefined
              }
            >
              {showEmpty ? "check_box" : "check_box_outline_blank"}
            </span>
            <span>Fullbokade</span>
          </button>

          {/* View mode */}
          <ToggleGroup.Root
            type="single"
            value={viewMode}
            onValueChange={(v) => {
              if (v) onViewModeChange(v as ViewMode);
            }}
            className="flex shrink-0 bg-surface-container rounded-md p-0.5 text-label-sm font-semibold font-body"
          >
            <ToggleGroup.Item
              value="calendar"
              aria-label="Kalendervy"
              className="flex items-center gap-1 px-3 py-1.5 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:shadow-ambient text-on-surface-variant data-[state=on]:text-on-surface"
            >
              <span aria-hidden="true">📅</span>
              <span>Kalender</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="list"
              aria-label="Listvy"
              className="flex items-center gap-1 px-3 py-1.5 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:shadow-ambient text-on-surface-variant data-[state=on]:text-on-surface"
            >
              <span aria-hidden="true">☰</span>
              <span>Lista</span>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>
      </div>
    </header>
  );
}

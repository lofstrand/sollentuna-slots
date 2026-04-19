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

        {/* Facility picker + view mode */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <button
            onClick={onOpenFacilityPicker}
            className="flex-1 min-w-0 flex items-center justify-between px-4 py-2.5 bg-surface-container rounded-md text-label-md font-body text-on-surface active:bg-surface-container-high transition-colors"
          >
            <span className="truncate font-semibold">{facilityLabel}</span>
            <span className="ml-2 text-on-surface-variant shrink-0 text-xs">▼</span>
          </button>
          <ToggleGroup.Root
            type="single"
            value={viewMode}
            onValueChange={(v) => { if (v) onViewModeChange(v as ViewMode); }}
            className="flex shrink-0 bg-surface-container rounded-md p-0.5 text-label-sm font-semibold font-body"
          >
            <ToggleGroup.Item
              value="calendar"
              aria-label="Kalendervy"
              className="flex items-center gap-1 px-3 py-2 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:shadow-ambient text-on-surface-variant data-[state=on]:text-on-surface"
            >
              <span className="material-symbols-outlined text-sm leading-none">calendar_month</span>
              <span className="hidden sm:inline">Kalender</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item
              value="list"
              aria-label="Listvy"
              className="flex items-center gap-1 px-3 py-2 rounded-[0.5rem] transition-colors data-[state=on]:bg-surface-container-lowest data-[state=on]:shadow-ambient text-on-surface-variant data-[state=on]:text-on-surface"
            >
              <span className="material-symbols-outlined text-sm leading-none">format_list_bulleted</span>
              <span className="hidden sm:inline">Lista</span>
            </ToggleGroup.Item>
          </ToggleGroup.Root>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          {/* Min duration */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-label-sm text-on-surface-variant font-body">Minst</span>
            <Select.Root
              value={String(minDuration)}
              onValueChange={(v) => onMinDurationChange(Number(v))}
            >
              <Select.Trigger className="flex items-center gap-1 text-label-sm bg-surface-container rounded-md py-1.5 px-2.5 text-on-surface font-semibold font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                <Select.Value />
                <Select.Icon className="text-on-surface-variant text-[10px]">▼</Select.Icon>
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

          {/* Divider */}
          <div className="hidden sm:block h-4 w-px bg-outline-variant/40 shrink-0" />

          {/* Filters group */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-label-sm text-on-surface-variant font-body mr-0.5">Visa</span>
            <button
              onClick={() => onShowBookedChange(!showBooked)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-label-sm font-semibold font-body transition-colors ${
                showBooked
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none"
                style={showBooked ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                sports_soccer
              </span>
              <span>Träning & match</span>
            </button>
            <button
              onClick={() => onShowEmptyChange(!showEmpty)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-label-sm font-semibold font-body transition-colors ${
                showEmpty
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-sm leading-none"
                style={showEmpty ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                event_busy
              </span>
              <span>Fullbokade</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

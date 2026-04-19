import { minToTime } from "../lib/schedule";

interface SlotRowProps {
  type: "free" | "training" | "match";
  startMin: number;
  endMin: number;
  description?: string;
}

export function SlotRow({
  type,
  startMin,
  endMin,
  description,
}: SlotRowProps) {
  if (type === "free") {
    return (
      <div className="flex items-center gap-1.5 py-2">
        <span className="material-symbols-outlined text-primary text-sm shrink-0">
          schedule
        </span>
        <span className="text-on-surface font-semibold text-sm font-body">
          {minToTime(startMin)} — {minToTime(endMin)}
        </span>
      </div>
    );
  }

  // Training / Match — muted row
  return (
    <div className="py-2 opacity-60">
      <div className="flex items-center gap-1.5">
        <span className="material-symbols-outlined text-on-surface-variant text-sm shrink-0">
          schedule
        </span>
        <span className="text-on-surface-variant font-medium text-sm font-body">
          {minToTime(startMin)} — {minToTime(endMin)}
        </span>
      </div>
      {description && (
        <div className="flex items-center gap-1.5 mt-0.5 ml-5">
          <span
            className="material-symbols-outlined text-tertiary text-sm"
            title="Fullbokad"
          >
            event_busy
          </span>
          <p className="text-xs text-on-surface-variant font-body truncate">
            {description}
          </p>
        </div>
      )}
    </div>
  );
}

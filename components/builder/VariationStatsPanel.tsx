import {
  VARIATION_STAT_FLAGS,
  type VariationStatFlag,
  type VariationStats,
} from "@/lib/variationStats";

const FLAG_LABEL: Record<VariationStatFlag, string> = {
  blocker: "Blocker",
  rush: "Rush",
  banish: "Banish",
  "double-attack": "Double attack",
  trigger: "Trigger",
};

function formatAvg(value: number | null, decimals: number): string {
  if (value == null) return "—";
  const rounded = Number(value.toFixed(decimals));
  return String(rounded);
}

function formatPower(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function StatChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[var(--bg-inset)] px-2.5 py-1.5">
      <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-[var(--ink-primary)]">
        {value}
      </p>
    </div>
  );
}

export function VariationStatsPanel({ stats }: { stats: VariationStats }) {
  return (
    <div className="poster-panel flex flex-col gap-3 p-4">
      <h3 className="font-display text-sm font-bold text-[var(--ink-primary)]">
        List summary
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatChip label="Avg cost" value={formatAvg(stats.avgCost, 1)} />
        <StatChip label="Avg power" value={formatAvg(stats.avgPower, 0)} />
        <StatChip
          label="Highest power"
          value={formatPower(stats.highestPower)}
        />
        <StatChip
          label="Characters"
          value={String(stats.byCategory.Character)}
        />
        <StatChip label="Events" value={String(stats.byCategory.Event)} />
        <StatChip label="Stages" value={String(stats.byCategory.Stage)} />
      </div>
      {stats.byColor.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--ink-muted)]">
          {stats.byColor.map((row) => (
            <span key={row.color}>
              {row.color}{" "}
              <span className="font-semibold text-[var(--ink-primary)]">
                {row.copies}
              </span>
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--ink-muted)]">
        {VARIATION_STAT_FLAGS.map((flag) => (
          <span key={flag}>
            {FLAG_LABEL[flag]}{" "}
            <span className="font-semibold text-[var(--ink-primary)]">
              {stats.flags[flag]}
            </span>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--ink-muted)]">
        <span>
          Counter 0{" "}
          <span className="font-semibold text-[var(--ink-primary)]">
            {stats.counter0}
          </span>
        </span>
        <span>
          Counter 1000{" "}
          <span className="font-semibold text-[var(--ink-primary)]">
            {stats.counter1000}
          </span>
        </span>
        <span>
          Counter 2000{" "}
          <span className="font-semibold text-[var(--ink-primary)]">
            {stats.counter2000}
          </span>
        </span>
        {stats.counterOther > 0 ? (
          <span>
            Other counter{" "}
            <span className="font-semibold text-[var(--ink-primary)]">
              {stats.counterOther}
            </span>
          </span>
        ) : null}
      </div>
      {stats.bySet.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--ink-muted)]">
          {stats.bySet.map((row) => (
            <span key={row.setCode}>
              {row.setCode}{" "}
              <span className="font-semibold text-[var(--ink-primary)]">
                {row.copies}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

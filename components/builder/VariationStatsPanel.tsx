import type { ReactNode } from "react";
import type { OptcgColor } from "@/types/catalog";
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

const COLOR_BG: Record<OptcgColor, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

const COLOR_BAR: Record<OptcgColor, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

function formatAvg(value: number | null, decimals: number): string {
  if (value == null) return "—";
  return String(Number(value.toFixed(decimals)));
}

function formatPower(value: number | null): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[var(--accent-ocean)]">
      {children}
    </p>
  );
}

function MeterRow({
  label,
  value,
  max,
  barClassName = "bg-[var(--accent-ocean)]",
  leading,
}: {
  label: string;
  value: number;
  max: number;
  barClassName?: string;
  leading?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[var(--ink-muted)]">
          {leading}
          <span className="truncate font-medium">{label}</span>
        </span>
        <span className="shrink-0 font-bold tabular-nums text-[var(--ink-primary)]">
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
        <div
          className={["h-full rounded-full transition-[width] duration-300", barClassName].join(
            " ",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-xl border px-3 py-3",
        accent
          ? "border-[var(--accent-pirate-red)]/25 bg-[linear-gradient(145deg,rgb(215_0_15_/_0.08),var(--bg-inset))]"
          : "border-[var(--bg-inset)] bg-[var(--bg-inset)]",
      ].join(" ")}
    >
      <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {label}
      </p>
      <p
        className={[
          "mt-1 font-display text-xl font-bold tabular-nums tracking-wide",
          accent ? "text-[var(--accent-pirate-red)]" : "text-[var(--ink-primary)]",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export function VariationStatsPanel({ stats }: { stats: VariationStats }) {
  const categoryTotal =
    stats.byCategory.Character +
    stats.byCategory.Event +
    stats.byCategory.Stage;
  const counterTotal =
    stats.counter0 +
    stats.counter1000 +
    stats.counter2000 +
    stats.counterOther;
  const colorMax = Math.max(1, ...stats.byColor.map((row) => row.copies));
  const setMax = Math.max(1, ...stats.bySet.map((row) => row.copies));
  const flagMax = Math.max(1, ...VARIATION_STAT_FLAGS.map((flag) => stats.flags[flag]));

  return (
    <div className="poster-panel flex flex-col gap-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="poster-stamp">Summary</p>
          <h3 className="font-display mt-2 text-base font-bold text-[var(--ink-primary)]">
            List profile
          </h3>
        </div>
        <div className="rounded-lg border border-[var(--bg-inset)] bg-[var(--bg-panel)] px-2.5 py-1.5 text-right">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Copies
          </p>
          <p className="font-display text-lg font-bold tabular-nums text-[var(--accent-ocean)]">
            {stats.copies}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <HeroStat label="Avg cost" value={formatAvg(stats.avgCost, 1)} />
        <HeroStat label="Avg power" value={formatAvg(stats.avgPower, 0)} />
        <HeroStat
          label="Top power"
          value={formatPower(stats.highestPower)}
          accent
        />
      </div>

      <section className="flex flex-col gap-2">
        <SectionLabel>Composition</SectionLabel>
        <div className="rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
          {categoryTotal > 0 ? (
            <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--bg-inset)]">
              <div
                className="h-full bg-[var(--accent-ocean)]"
                style={{
                  width: `${(stats.byCategory.Character / categoryTotal) * 100}%`,
                }}
                title={`Characters ${stats.byCategory.Character}`}
              />
              <div
                className="h-full bg-[var(--accent-pirate-red)]"
                style={{
                  width: `${(stats.byCategory.Event / categoryTotal) * 100}%`,
                }}
                title={`Events ${stats.byCategory.Event}`}
              />
              <div
                className="h-full bg-[var(--accent-gold)]"
                style={{
                  width: `${(stats.byCategory.Stage / categoryTotal) * 100}%`,
                }}
                title={`Stages ${stats.byCategory.Stage}`}
              />
            </div>
          ) : null}
          <div className="grid grid-cols-3 gap-2 text-center">
            {(
              [
                ["Characters", stats.byCategory.Character, "bg-[var(--accent-ocean)]"],
                ["Events", stats.byCategory.Event, "bg-[var(--accent-pirate-red)]"],
                ["Stages", stats.byCategory.Stage, "bg-[var(--accent-gold)]"],
              ] as const
            ).map(([label, value, swatch]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className={["h-1.5 w-1.5 rounded-full", swatch].join(" ")} />
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  {label}
                </p>
                <p className="text-base font-bold tabular-nums text-[var(--ink-primary)]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stats.byColor.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionLabel>Colors</SectionLabel>
          <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
            {stats.byColor.map((row) => (
              <MeterRow
                key={row.color}
                label={row.color}
                value={row.copies}
                max={colorMax}
                barClassName={COLOR_BAR[row.color]}
                leading={
                  <span
                    className={[
                      "inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                      COLOR_BG[row.color],
                    ].join(" ")}
                    aria-hidden
                  />
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <SectionLabel>Keywords</SectionLabel>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VARIATION_STAT_FLAGS.map((flag) => {
            const value = stats.flags[flag];
            const hot = value > 0;
            return (
              <div
                key={flag}
                className={[
                  "rounded-xl border px-2.5 py-2",
                  hot
                    ? "border-[var(--accent-ocean)]/30 bg-[rgb(46_99_164_/_0.08)]"
                    : "border-[var(--bg-inset)] bg-[var(--bg-inset)]/60",
                ].join(" ")}
              >
                <p className="text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
                  {FLAG_LABEL[flag]}
                </p>
                <div className="mt-1 flex items-end justify-between gap-2">
                  <p
                    className={[
                      "text-lg font-bold tabular-nums",
                      hot
                        ? "text-[var(--accent-ocean)]"
                        : "text-[var(--ink-muted)]",
                    ].join(" ")}
                  >
                    {value}
                  </p>
                  <div className="mb-1 h-1 w-10 overflow-hidden rounded-full bg-[var(--bg-panel)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent-ocean)]"
                      style={{ width: `${(value / flagMax) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Counters</SectionLabel>
        <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
          {(
            [
              ["Counter 0", stats.counter0, "bg-[var(--ink-muted)]"],
              ["Counter 1000", stats.counter1000, "bg-[var(--accent-ocean)]"],
              ["Counter 2000", stats.counter2000, "bg-[var(--accent-pirate-red)]"],
            ] as const
          ).map(([label, value, bar]) => (
            <MeterRow
              key={label}
              label={label}
              value={value}
              max={Math.max(1, counterTotal)}
              barClassName={bar}
            />
          ))}
          {stats.counterOther > 0 ? (
            <MeterRow
              label="Other"
              value={stats.counterOther}
              max={Math.max(1, counterTotal)}
              barClassName="bg-[var(--accent-gold)]"
            />
          ) : null}
        </div>
      </section>

      {stats.bySet.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionLabel>Sets in list</SectionLabel>
          <div className="flex flex-col gap-2.5 rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
            {stats.bySet.map((row) => (
              <MeterRow
                key={row.setCode}
                label={row.setCode}
                value={row.copies}
                max={setMax}
                barClassName="bg-[var(--accent-ocean)]"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

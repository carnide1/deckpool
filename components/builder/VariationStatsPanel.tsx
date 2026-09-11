"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
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
  unblockable: "Unblockable",
  searcher: "Searcher",
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

function formatInt(value: number | null): string {
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

function SectionCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-3">
        {children}
      </div>
    </section>
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
          className={["h-full rounded-full transition-[width]", barClassName].join(
            " ",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DistBars({
  rows,
  emptyLabel,
}: {
  rows: { label: string; copies: number }[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-xs text-[var(--ink-muted)]">{emptyLabel}</p>;
  }
  const max = Math.max(...rows.map((row) => row.copies));
  return (
    <div className="mt-2.5 flex flex-col gap-2">
      {rows.map((row) => (
        <MeterRow
          key={row.label}
          label={row.label}
          value={row.copies}
          max={max}
          barClassName="bg-[var(--accent-ocean)]"
        />
      ))}
    </div>
  );
}

export function VariationStatsPanel({ stats }: { stats: VariationStats }) {
  const [open, setOpen] = useState(false);

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

  return (
    <div className="@container/summary poster-panel p-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
          List summary
        </h3>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-[var(--ink-muted)] transition-transform duration-300 ease-out",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      <div className="mt-2 flex flex-col gap-2">
        <div>
          <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Averages
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-inset)] bg-[var(--bg-inset)]/50 px-2.5 py-1 text-[0.6875rem] text-[var(--ink-muted)]">
              Cost
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatAvg(stats.avgCost, 1)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-inset)] bg-[var(--bg-inset)]/50 px-2.5 py-1 text-[0.6875rem] text-[var(--ink-muted)]">
              Power
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {formatAvg(stats.avgPower, 0)}
              </span>
            </span>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Composition
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-inset)] px-2.5 py-1 text-[0.6875rem] text-[var(--ink-muted)]">
              <span className="@min-[17rem]/summary:hidden">Char</span>
              <span className="hidden @min-[17rem]/summary:inline">
                Character
              </span>
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {stats.byCategory.Character}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-inset)] px-2.5 py-1 text-[0.6875rem] text-[var(--ink-muted)]">
              Event
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {stats.byCategory.Event}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-[var(--bg-inset)] px-2.5 py-1 text-[0.6875rem] text-[var(--ink-muted)]">
              Stage
              <span className="font-semibold tabular-nums text-[var(--ink-primary)]">
                {stats.byCategory.Stage}
              </span>
            </span>
          </div>
        </div>

        <div>
          <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Keywords
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {VARIATION_STAT_FLAGS.map((flag) => {
              const value = stats.flags[flag];
              return (
                <span
                  key={flag}
                  className={[
                    "inline-flex min-w-0 items-center justify-between gap-1 rounded-full border px-2.5 py-1 text-[0.6875rem]",
                    value > 0
                      ? "border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)]"
                      : "border-[var(--bg-inset)]/70 bg-[var(--bg-inset)]/35 text-[var(--ink-muted)]",
                  ].join(" ")}
                >
                  <span className="truncate">{FLAG_LABEL[flag]}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {value}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div
            className={[
              "flex flex-col gap-3 border-t border-[var(--bg-inset)] pt-3 transition-[opacity,transform] duration-300 ease-out",
              open
                ? "mt-3 translate-y-0 opacity-100"
                : "mt-0 -translate-y-1 opacity-0",
            ].join(" ")}
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
          <SectionCard label="Cost">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Avg", formatAvg(stats.avgCost, 1)],
                  ["Low", formatInt(stats.lowestCost)],
                  ["High", formatInt(stats.highestCost)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[0.625rem] font-medium text-[var(--ink-muted)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--ink-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <DistBars
              emptyLabel="No cost data"
              rows={stats.byCost.map((row) => ({
                label: String(row.cost),
                copies: row.copies,
              }))}
            />
          </SectionCard>

          <SectionCard label="Power">
            <div className="grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Avg", formatAvg(stats.avgPower, 0)],
                  ["Low", formatInt(stats.lowestPower)],
                  ["High", formatInt(stats.highestPower)],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[0.625rem] font-medium text-[var(--ink-muted)]">
                    {label}
                  </p>
                  <p className="mt-0.5 text-base font-bold tabular-nums text-[var(--ink-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <DistBars
              emptyLabel="No power data"
              rows={stats.byPower.map((row) => ({
                label: row.power.toLocaleString("en-US"),
                copies: row.copies,
              }))}
            />
          </SectionCard>

          <SectionCard label="Composition">
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
                  [
                    "Characters",
                    stats.byCategory.Character,
                    "bg-[var(--accent-ocean)]",
                  ],
                  [
                    "Events",
                    stats.byCategory.Event,
                    "bg-[var(--accent-pirate-red)]",
                  ],
                  [
                    "Stages",
                    stats.byCategory.Stage,
                    "bg-[var(--accent-gold)]",
                  ],
                ] as const
              ).map(([label, value, swatch]) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span
                    className={["h-1.5 w-1.5 rounded-full", swatch].join(" ")}
                  />
                  <p className="text-[0.625rem] font-medium text-[var(--ink-muted)]">
                    {label}
                  </p>
                  <p className="text-base font-bold tabular-nums text-[var(--ink-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          {stats.byColor.length > 0 ? (
            <SectionCard label="Colors">
              <div className="flex flex-col gap-2.5">
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
                          COLOR_BAR[row.color],
                        ].join(" ")}
                        aria-hidden
                      />
                    }
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          <SectionCard label="Keywords">
            <div className="flex flex-col gap-1.5">
              {VARIATION_STAT_FLAGS.map((flag) => {
                const value = stats.flags[flag];
                return (
                  <div
                    key={flag}
                    className="flex items-baseline justify-between gap-2 text-xs"
                  >
                    <span className="text-[var(--ink-muted)]">
                      {FLAG_LABEL[flag]}
                    </span>
                    <span
                      className={[
                        "font-semibold tabular-nums",
                        value > 0
                          ? "text-[var(--ink-primary)]"
                          : "text-[var(--ink-muted)]",
                      ].join(" ")}
                    >
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard label="Counters">
            <div className="flex flex-col gap-2.5">
              <MeterRow
                label="Counter 0"
                value={stats.counter0}
                max={Math.max(1, counterTotal)}
                barClassName="bg-[var(--ink-muted)]"
              />
              <MeterRow
                label="Counter 1000"
                value={stats.counter1000}
                max={Math.max(1, counterTotal)}
                barClassName="bg-[var(--accent-ocean)]"
              />
              <MeterRow
                label="Counter 2000"
                value={stats.counter2000}
                max={Math.max(1, counterTotal)}
                barClassName="bg-[var(--accent-pirate-red)]"
              />
              {stats.counterOther > 0 ? (
                <MeterRow
                  label="Other"
                  value={stats.counterOther}
                  max={Math.max(1, counterTotal)}
                  barClassName="bg-[var(--accent-gold)]"
                />
              ) : null}
            </div>
          </SectionCard>

          {stats.bySet.length > 0 ? (
            <SectionCard label="Sets in list">
              <div className="flex flex-col gap-2.5">
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
            </SectionCard>
          ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

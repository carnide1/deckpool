import type { CollectionBreakdown } from "@/lib/collectionBreakdown";
import type { OptcgColor } from "@/types/catalog";

const COLOR_CLASS: Record<OptcgColor, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

function PairCells({ unique, copies }: { unique: number; copies: number }) {
  return (
    <>
      <td className="py-1.5 text-right tabular-nums">{unique.toLocaleString()}</td>
      <td className="py-1.5 text-right tabular-nums">{copies.toLocaleString()}</td>
    </>
  );
}

export function CollectionSummary({
  breakdown,
}: {
  breakdown: CollectionBreakdown;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="poster-panel grid grid-cols-2 gap-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Unique cards
          </p>
          <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[var(--ink-primary)]">
            {breakdown.unique.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
            Total copies
          </p>
          <p className="font-display mt-1 text-3xl font-bold tabular-nums text-[var(--ink-primary)]">
            {breakdown.copies.toLocaleString()}
          </p>
        </div>
      </div>

      <section className="poster-panel p-5">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          By category
        </h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 text-right font-semibold">Unique</th>
              <th className="pb-2 text-right font-semibold">Copies</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.byCategory.map((row) => (
              <tr key={row.category} className="border-t border-[var(--bg-inset)]">
                <td className="py-1.5">{row.category}</td>
                <PairCells unique={row.unique} copies={row.copies} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="poster-panel p-5">
        <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
          By color
        </h2>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          Dual-color cards count in each of their colors, so these totals can
          exceed unique cards and copies.
        </p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-muted)]">
              <th className="pb-2 font-semibold">Color</th>
              <th className="pb-2 text-right font-semibold">Unique</th>
              <th className="pb-2 text-right font-semibold">Copies</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.byColor.map((row) => (
              <tr key={row.color} className="border-t border-[var(--bg-inset)]">
                <td className="py-1.5">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${COLOR_CLASS[row.color]}`}
                      aria-hidden
                    />
                    {row.color}
                  </span>
                </td>
                <PairCells unique={row.unique} copies={row.copies} />
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="poster-panel p-5">
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            By cost
          </h2>
          {breakdown.byCost.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No cards yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                  <th className="pb-2 font-semibold">Cost</th>
                  <th className="pb-2 text-right font-semibold">Unique</th>
                  <th className="pb-2 text-right font-semibold">Copies</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.byCost.map((row) => (
                  <tr
                    key={row.cost === null ? "none" : row.cost}
                    className="border-t border-[var(--bg-inset)]"
                  >
                    <td className="py-1.5 tabular-nums">{row.cost ?? "—"}</td>
                    <PairCells unique={row.unique} copies={row.copies} />
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="poster-panel p-5">
          <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
            By rarity
          </h2>
          {breakdown.byRarity.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--ink-muted)]">No cards yet.</p>
          ) : (
            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-[var(--ink-muted)]">
                  <th className="pb-2 font-semibold">Rarity</th>
                  <th className="pb-2 text-right font-semibold">Unique</th>
                  <th className="pb-2 text-right font-semibold">Copies</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.byRarity.map((row) => (
                  <tr key={row.rarity} className="border-t border-[var(--bg-inset)]">
                    <td className="py-1.5">{row.rarity}</td>
                    <PairCells unique={row.unique} copies={row.copies} />
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

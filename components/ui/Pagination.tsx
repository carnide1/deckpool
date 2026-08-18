"use client";

import { clampPage, pageCountFor, visiblePageTokens } from "@/lib/pagination";

export function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = pageCountFor(total, pageSize);
  if (total <= 0 || pageCount <= 0) return null;

  const current = clampPage(page, pageCount);
  const start = (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);
  const tokens = visiblePageTokens(current, pageCount);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <p className="text-xs tabular-nums text-[var(--ink-muted)]">
        {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {total.toLocaleString()}
      </p>
      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            className="rounded-lg border border-[var(--bg-inset)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] disabled:opacity-40"
          >
            Previous
          </button>
          {tokens.map((token, index) =>
            token === "gap" ? (
              <span
                key={`gap-${index}`}
                className="px-1 text-xs text-[var(--ink-muted)]"
              >
                …
              </span>
            ) : (
              <button
                key={token}
                type="button"
                onClick={() => onPageChange(token)}
                aria-current={token === current ? "page" : undefined}
                className={[
                  "min-w-8 rounded-lg px-2.5 py-1 text-xs font-semibold tabular-nums",
                  token === current
                    ? "bg-[var(--bg-inset)] text-[var(--ink-primary)]"
                    : "text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]",
                ].join(" ")}
              >
                {token}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= pageCount}
            className="rounded-lg border border-[var(--bg-inset)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

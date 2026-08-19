"use client";

import type { MouseEvent } from "react";

export function WantedStamp({
  posted,
  count = 0,
  showCount = false,
  onClick,
  disabled,
}: {
  posted: boolean;
  count?: number;
  showCount?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const label = posted
    ? showCount && count > 0
      ? `Drop bounty, ${count} copies`
      : "Drop bounty"
    : "Post bounty";

  const stop = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <button
      type="button"
      onClick={(event) => {
        stop(event);
        onClick();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={disabled}
      aria-pressed={posted}
      aria-label={label}
      className={[
        "wanted-stamp shadow-[var(--shadow-paper)] disabled:opacity-40",
        posted ? "wanted-stamp-posted" : "wanted-stamp-empty",
      ].join(" ")}
    >
      <span>Wanted</span>
      {showCount && posted && count > 0 ? (
        <span className="tabular-nums tracking-normal">×{count}</span>
      ) : null}
    </button>
  );
}

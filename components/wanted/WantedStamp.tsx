"use client";

import type { MouseEvent } from "react";

type WantedStampProps = {
  posted: boolean;
  count?: number;
  showCount?: boolean;
  disabled?: boolean;
} & (
  | { onClick: () => void; readOnly?: false }
  /** Display-only stamp (e.g. a friend's bounty). */
  | { readOnly: true; onClick?: never }
);

export function WantedStamp({
  posted,
  count = 0,
  showCount = false,
  onClick,
  disabled,
  readOnly,
}: WantedStampProps) {
  const countLabel = (
    <>
      <span>Wanted</span>
      {showCount && posted && count > 0 ? (
        <span className="tabular-nums tracking-normal">×{count}</span>
      ) : null}
    </>
  );
  const className = [
    "wanted-stamp shadow-[var(--shadow-paper)] disabled:opacity-40",
    posted ? "wanted-stamp-posted" : "wanted-stamp-empty",
  ].join(" ");

  if (readOnly) {
    return (
      <span
        className={className}
        aria-label={count > 0 ? `Wanted, ${count} copies` : "Wanted"}
      >
        {countLabel}
      </span>
    );
  }

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
        onClick?.();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      disabled={disabled}
      aria-pressed={posted}
      aria-label={label}
      className={className}
    >
      {countLabel}
    </button>
  );
}

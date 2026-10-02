export function DeckStatusBadges({
  legal,
  owned,
}: {
  legal: boolean;
  /** Omit to show Legal/Illegal only (e.g. a friend's deck). */
  owned?: boolean;
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-1.5 text-xs font-semibold">
      <span
        className={
          legal
            ? "text-[var(--badge-legal)]"
            : "text-[var(--badge-illegal)]"
        }
      >
        {legal ? "Legal" : "Illegal"}
      </span>
      {owned === undefined ? null : (
        <>
          <span className="font-normal text-[var(--ink-muted)]" aria-hidden>
            ·
          </span>
          <span
            className={
              owned
                ? "text-[var(--badge-owned)]"
                : "text-[var(--badge-unowned)]"
            }
          >
            {owned ? "Owned" : "Unowned"}
          </span>
        </>
      )}
    </p>
  );
}

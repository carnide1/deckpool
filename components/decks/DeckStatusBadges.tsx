export function DeckStatusBadges({
  anyLegal,
  anyOwned,
}: {
  anyLegal: boolean;
  anyOwned: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span
        className={[
          "rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide",
          anyLegal
            ? "bg-[var(--badge-legal)]/15 text-[var(--badge-legal)]"
            : "border border-[var(--badge-illegal)] text-[var(--badge-illegal)]",
        ].join(" ")}
      >
        {anyLegal ? "Legal" : "Illegal"}
      </span>
      <span
        className={[
          "rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide",
          anyOwned
            ? "bg-[var(--badge-owned)]/15 text-[var(--badge-owned)]"
            : "bg-[var(--badge-unowned)]/15 text-[var(--badge-unowned)]",
        ].join(" ")}
      >
        {anyOwned ? "Owned" : "Unowned"}
      </span>
    </div>
  );
}

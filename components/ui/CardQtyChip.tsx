"use client";

/** Compact qty chip for card-art overlays. */
export function CardQtyChip({
  label,
  value,
  accentClassName,
  visible,
}: {
  label: string;
  value: number;
  /** Background color class for the chip (e.g. bg-[var(--badge-owned)]). */
  accentClassName: string;
  visible: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex h-6 items-center gap-1 rounded-lg px-1.5 text-[0.625rem] shadow-sm",
        accentClassName,
        visible ? "" : "invisible",
      ].join(" ")}
      aria-hidden={!visible}
    >
      <span className="font-medium tracking-wide text-white/85">{label}</span>
      <span className="font-semibold tabular-nums text-white">
        {visible ? value : 0}
      </span>
    </span>
  );
}

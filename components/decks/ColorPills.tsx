import type { OptcgColor } from "@/types/catalog";

const COLOR_CLASS: Record<OptcgColor, string> = {
  Red: "bg-[var(--color-red)]",
  Green: "bg-[var(--color-green)]",
  Blue: "bg-[var(--color-blue)]",
  Purple: "bg-[var(--color-purple)]",
  Black: "bg-[var(--color-black)]",
  Yellow: "bg-[var(--color-yellow)]",
};

export function ColorPills({ colors }: { colors: OptcgColor[] }) {
  if (colors.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {colors.map((color) => (
        <span
          key={color}
          className={[
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-white",
            COLOR_CLASS[color],
          ].join(" ")}
        >
          {color}
        </span>
      ))}
    </div>
  );
}

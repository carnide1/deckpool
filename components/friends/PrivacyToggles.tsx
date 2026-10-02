"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useUserProfile } from "@/contexts/UserProfileContext";
import type { PrivacyArea } from "@/types/friends";

const AREAS: { area: PrivacyArea; label: string }[] = [
  { area: "decks", label: "Show my decks to friends" },
  { area: "collection", label: "Show my collection to friends" },
  { area: "wanted", label: "Show my Wanted to friends" },
];

export function PrivacyToggles() {
  const { privacy, setPrivacy } = useUserProfile();
  const [saving, setSaving] = useState<PrivacyArea | null>(null);

  if (!privacy) return null;

  const toggle = async (area: PrivacyArea) => {
    setSaving(area);
    try {
      await setPrivacy(area, !privacy[area]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save privacy",
      );
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="poster-panel p-5">
      <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
        Privacy
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Applies to all friends. Friends can never edit your stuff.
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {AREAS.map(({ area, label }) => {
          const on = privacy[area];
          return (
            <li key={area} className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--ink-primary)]">{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={label}
                disabled={saving === area}
                onClick={() => void toggle(area)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50",
                  on ? "bg-[var(--accent-ocean)]" : "bg-[var(--bg-inset)]",
                ].join(" ")}
              >
                <span
                  className={[
                    "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
                    on ? "translate-x-5" : "translate-x-0.5",
                  ].join(" ")}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

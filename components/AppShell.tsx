"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Compass,
  Layers,
  ScrollText,
  User,
  type LucideIcon,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/wanted", label: "Wanted", icon: ScrollText },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/decks", label: "Decks", icon: Anchor },
] as const;

const PROFILE_NAV = {
  href: "/profile",
  label: "Profile",
  icon: User,
} as const;

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function FloatingNavButton({
  href,
  label,
  icon: Icon,
  tooltipSide,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltipSide: "right" | "top";
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={[
        "group pointer-events-auto relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-[var(--shadow-poster)] transition-[background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]",
        active
          ? "border-[var(--accent-pirate-red)] bg-[var(--accent-pirate-red)] text-white"
          : "border-[var(--bg-inset)] bg-[var(--bg-panel)]/90 text-[var(--ink-muted)] backdrop-blur hover:text-[var(--accent-pirate-red)]",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" aria-hidden />
      <span
        role="tooltip"
        className={[
          "pointer-events-none absolute whitespace-nowrap rounded-md bg-[var(--ink-primary)] px-2 py-1 text-xs font-semibold text-[var(--bg-panel)] opacity-0 shadow-[var(--shadow-paper)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100",
          tooltipSide === "right"
            ? "left-full top-1/2 ml-3 -translate-y-1/2"
            : "bottom-full left-1/2 mb-2 -translate-x-1/2",
        ].join(" ")}
      >
        {label}
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--bg-page)]">
      <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pl-24">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
      >
        {PRIMARY_NAV.map((item) => (
          <FloatingNavButton key={item.href} tooltipSide="right" {...item} />
        ))}
        <span className="mx-auto h-px w-6 bg-[var(--ink-muted)]/30" aria-hidden />
        <FloatingNavButton tooltipSide="right" {...PROFILE_NAV} />
      </nav>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-center gap-3 md:hidden"
      >
        {PRIMARY_NAV.map((item) => (
          <FloatingNavButton key={item.href} tooltipSide="top" {...item} />
        ))}
        <span className="h-6 w-px bg-[var(--ink-muted)]/30" aria-hidden />
        <FloatingNavButton tooltipSide="top" {...PROFILE_NAV} />
      </nav>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Compass,
  Layers,
  ScrollText,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useFriends } from "@/contexts/FriendsContext";

const FRIENDS_HREF = "/friends";

const PRIMARY_NAV = [
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/wanted", label: "Wanted", icon: ScrollText },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/decks", label: "Decks", icon: Anchor },
  { href: FRIENDS_HREF, label: "Friends", icon: Users },
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
  badgeCount = 0,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  tooltipSide: "right" | "top";
  badgeCount?: number;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);
  const ariaLabel =
    badgeCount > 0
      ? `${label}, ${badgeCount} pending ${badgeCount === 1 ? "request" : "requests"}`
      : label;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={[
        "group pointer-events-auto relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border shadow-[var(--shadow-poster)] transition-[background-color,color,transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]",
        active
          ? "border-[var(--accent-pirate-red)] bg-[var(--accent-pirate-red)] text-white"
          : "border-[var(--bg-inset)] bg-[var(--bg-panel)]/90 text-[var(--ink-muted)] backdrop-blur hover:text-[var(--accent-pirate-red)]",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {badgeCount > 0 ? (
        <span
          aria-hidden
          className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[var(--bg-page)] bg-[var(--accent-pirate-red)] px-1 text-[0.625rem] font-bold leading-none text-white tabular-nums"
        >
          {badgeCount > 9 ? "9+" : badgeCount}
        </span>
      ) : null}
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
  const { pendingIncomingCount } = useFriends();
  const badgeFor = (href: string) =>
    href === FRIENDS_HREF ? pendingIncomingCount : 0;

  return (
    <div className="relative min-h-dvh">
      <main className="p-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:p-8 md:pl-24">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed left-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 md:flex"
      >
        {PRIMARY_NAV.map((item) => (
          <FloatingNavButton
            key={item.href}
            tooltipSide="right"
            badgeCount={badgeFor(item.href)}
            {...item}
          />
        ))}
        <FloatingNavButton tooltipSide="right" {...PROFILE_NAV} />
      </nav>

      <nav
        aria-label="Primary"
        className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-center gap-2 min-[380px]:gap-3 md:hidden"
      >
        {PRIMARY_NAV.map((item) => (
          <FloatingNavButton
            key={item.href}
            tooltipSide="top"
            badgeCount={badgeFor(item.href)}
            {...item}
          />
        ))}
        <FloatingNavButton tooltipSide="top" {...PROFILE_NAV} />
      </nav>
    </div>
  );
}

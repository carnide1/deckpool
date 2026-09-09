"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Compass,
  Layers,
  PanelLeftClose,
  ScrollText,
  User,
  type LucideIcon,
} from "lucide-react";

const SIDEBAR_STORAGE_KEY = "deckpool.sidebarExpanded";

const PRIMARY_NAV = [
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/wanted", label: "Wanted", icon: ScrollText },
  { href: "/cards", label: "Cards", icon: Compass },
  { href: "/decks", label: "Decks", icon: Anchor },
] as const;

const PROFILE_NAV = {
  href: "/profile",
  label: "Profile",
  icon: User,
} as const;

let sidebarExpandedCache: boolean | null = null;
const sidebarListeners = new Set<() => void>();

function readSidebarExpanded(): boolean {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (raw === "0") return false;
    if (raw === "1") return true;
  } catch {
    /* ignore storage failures */
  }
  return true;
}

function getSidebarExpandedSnapshot(): boolean {
  if (sidebarExpandedCache === null) {
    sidebarExpandedCache = readSidebarExpanded();
  }
  return sidebarExpandedCache;
}

function getSidebarExpandedServerSnapshot(): boolean {
  return true;
}

function subscribeSidebarExpanded(listener: () => void) {
  sidebarListeners.add(listener);
  return () => {
    sidebarListeners.delete(listener);
  };
}

function setSidebarExpanded(next: boolean) {
  sidebarExpandedCache = next;
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* ignore storage failures */
  }
  for (const listener of sidebarListeners) listener();
}

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
  layout,
  expanded = true,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  layout: "sidebar" | "bottom";
  expanded?: boolean;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  if (layout === "sidebar") {
    return (
      <Link
        href={href}
        title={expanded ? undefined : label}
        aria-label={expanded ? undefined : label}
        aria-current={active ? "page" : undefined}
        className={[
          "flex items-center rounded-lg text-sm font-semibold transition-[background-color,color,padding] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]",
          expanded ? "gap-3 px-3 py-2.5" : "justify-center px-2 py-2.5",
          active
            ? "bg-[var(--bg-inset)] text-[var(--accent-pirate-red)] shadow-[inset_3px_0_0_0_var(--accent-pirate-red)]"
            : "text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]/70 hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span
          className={[
            "overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-200",
            expanded ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0",
          ].join(" ")}
          aria-hidden={!expanded}
        >
          {label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]",
        active
          ? "text-[var(--accent-pirate-red)]"
          : "text-[var(--ink-muted)]",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
      {active ? (
        <span
          className="mt-0.5 h-0.5 w-6 rounded-full bg-[var(--accent-pirate-red)]"
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const profileActive = isActivePath(pathname, PROFILE_NAV.href);
  const expanded = useSyncExternalStore(
    subscribeSidebarExpanded,
    getSidebarExpandedSnapshot,
    getSidebarExpandedServerSnapshot,
  );

  const collapseSidebar = () => setSidebarExpanded(false);
  const expandSidebar = () => setSidebarExpanded(true);

  /** Collapsed only: empty chrome expands; nav links still navigate. */
  const onCollapsedRailClick = (event: React.MouseEvent<HTMLElement>) => {
    if (expanded) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    expandSidebar();
  };

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--bg-page)] md:flex-row">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--bg-inset)] bg-[var(--bg-panel)] px-4 py-3 shadow-[var(--shadow-paper)] md:hidden">
        <span className="font-display text-lg font-bold tracking-wide text-[var(--accent-pirate-red)]">
          DeckPool
        </span>
        <Link
          href={PROFILE_NAV.href}
          aria-label="Profile"
          aria-current={profileActive ? "page" : undefined}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]",
            profileActive
              ? "bg-[var(--bg-inset)] text-[var(--accent-pirate-red)]"
              : "text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]/70 hover:text-[var(--ink-primary)]",
          ].join(" ")}
        >
          <User className="h-5 w-5 shrink-0" aria-hidden />
          <span>Profile</span>
        </Link>
      </header>

      <aside
        aria-label="App"
        title={expanded ? undefined : "Click empty space to expand"}
        onClick={onCollapsedRailClick}
        className={[
          "hidden shrink-0 flex-col border-r border-[var(--bg-inset)] bg-[var(--bg-panel)] shadow-[var(--shadow-paper)] transition-[width] duration-200 ease-out md:flex",
          expanded ? "w-56" : "w-16 cursor-e-resize",
        ].join(" ")}
      >
        <div
          className={[
            "flex shrink-0 items-center border-b border-[var(--bg-inset)]",
            expanded ? "gap-2 px-3 py-3" : "justify-center px-2 py-3",
          ].join(" ")}
        >
          {expanded ? (
            <>
              <span className="min-w-0 flex-1 truncate font-display text-base font-bold tracking-wide text-[var(--accent-pirate-red)]">
                DeckPool
              </span>
              <button
                type="button"
                onClick={collapseSidebar}
                aria-expanded={true}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--ink-muted)] transition-colors hover:bg-[var(--bg-inset)]/70 hover:text-[var(--ink-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-ocean)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-panel)]"
              >
                <PanelLeftClose className="h-4 w-4" aria-hidden />
              </button>
            </>
          ) : (
            <span className="font-display text-sm font-bold tracking-wide text-[var(--accent-pirate-red)]">
              DP
            </span>
          )}
        </div>

        <nav
          className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.href}
              layout="sidebar"
              expanded={expanded}
              {...item}
            />
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--bg-inset)] p-2">
          <NavLink
            layout="sidebar"
            expanded={expanded}
            {...PROFILE_NAV}
          />
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        <nav
          className="flex shrink-0 justify-around border-t border-[var(--bg-inset)] bg-[var(--bg-panel)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-paper)] md:hidden"
          aria-label="Primary"
        >
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} layout="bottom" {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}

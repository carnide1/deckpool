"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Compass, Layers, User } from "lucide-react";

const NAV = [
  { href: "/collection", label: "Collection", icon: Layers },
  { href: "/cards", label: "Cards", icon: Compass },
  { href: "/decks", label: "Decks", icon: Anchor },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
  layout,
}: {
  href: string;
  label: string;
  icon: typeof Layers;
  layout: "sidebar" | "bottom";
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  if (layout === "sidebar") {
    return (
      <Link
        href={href}
        className={[
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-[var(--bg-inset)] text-[var(--accent-pirate-red)]"
            : "text-[var(--ink-muted)] hover:bg-[var(--bg-inset)]/60 hover:text-[var(--ink-primary)]",
        ].join(" ")}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={[
        "flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1 text-[10px] font-semibold transition-colors",
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
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-page)] md:flex-row">
      <header className="border-b border-[var(--bg-inset)] bg-[var(--bg-panel)] px-4 py-3 shadow-[var(--shadow-paper)] md:hidden">
        <span className="font-display text-lg font-bold text-[var(--accent-pirate-red)]">
          DeckPool
        </span>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--bg-inset)] bg-[var(--bg-panel)] shadow-[var(--shadow-paper)] md:flex">
        <div className="border-b border-[var(--bg-inset)] px-4 py-5">
          <span className="font-display text-xl font-bold text-[var(--accent-pirate-red)]">
            DeckPool
          </span>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            Brew from what you own
          </p>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink key={item.href} layout="sidebar" {...item} />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        <nav className="flex justify-around border-t border-[var(--bg-inset)] bg-[var(--bg-panel)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-paper)] md:hidden">
          {NAV.map((item) => (
            <NavLink key={item.href} layout="bottom" {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}

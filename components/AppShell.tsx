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
}: {
  href: string;
  label: string;
  icon: typeof Layers;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium md:flex-row md:gap-2 md:text-sm ${
        active
          ? "text-[var(--accent-pirate-red)]"
          : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-page)] md:flex-row">
      <header className="border-b border-[var(--bg-inset)] bg-[var(--bg-panel)] px-4 py-3 md:hidden">
        <span className="font-display text-lg font-bold text-[var(--accent-pirate-red)]">
          DeckPool
        </span>
      </header>

      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--bg-inset)] bg-[var(--bg-panel)] md:flex">
        <div className="border-b border-[var(--bg-inset)] px-4 py-5">
          <span className="font-display text-xl font-bold text-[var(--accent-pirate-red)]">
            DeckPool
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        <nav className="flex justify-around border-t border-[var(--bg-inset)] bg-[var(--bg-panel)] py-2 md:hidden">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
      </div>
    </div>
  );
}

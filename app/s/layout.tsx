import { CatalogProvider } from "@/contexts/CatalogContext";
import Link from "next/link";

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CatalogProvider>
      <div className="min-h-dvh bg-[var(--bg-page)]">
        <header className="flex items-center justify-between border-b border-[var(--bg-inset)] px-4 py-3">
          <Link
            href="/"
            className="font-display text-xl font-bold text-[var(--accent-pirate-red)]"
          >
            DeckPool
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-[var(--accent-ocean)] hover:underline"
          >
            Make your own
          </Link>
        </header>
        {children}
      </div>
    </CatalogProvider>
  );
}

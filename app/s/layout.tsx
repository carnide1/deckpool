import { CatalogProvider } from "@/contexts/CatalogContext";
import { ShareHeaderCta } from "@/components/share/ShareHeaderCta";
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
          <ShareHeaderCta />
        </header>
        {children}
      </div>
    </CatalogProvider>
  );
}

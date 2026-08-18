import Link from "next/link";

export function AuthPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--bg-page)] px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-[var(--bg-inset)] bg-[var(--bg-panel)] p-8 shadow-sm">
        <Link
          href="/"
          className="mb-6 inline-block font-display text-xl font-bold text-[var(--accent-pirate-red)]"
        >
          DeckPool
        </Link>
        <h1 className="font-display text-2xl font-bold text-[var(--ink-primary)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 mb-6 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        ) : (
          <div className="mb-6" />
        )}
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--bg-page)] px-6 text-center">
      <p className="font-display text-2xl font-bold text-[var(--accent-pirate-red)]">
        DeckPool
      </p>
      <h1 className="text-xl font-semibold text-[var(--ink-primary)]">
        Page not found
      </h1>
      <p className="max-w-sm text-sm text-[var(--ink-muted)]">
        That route does not exist. Head back to the app and try again.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--accent-pirate-red)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Go home
      </Link>
    </div>
  );
}

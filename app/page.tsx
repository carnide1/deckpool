import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg-page)]">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-2xl font-bold text-[var(--accent-pirate-red)]">
          DeckPool
        </span>
        <div className="flex gap-3 text-sm font-medium">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-[var(--accent-pirate-red)] px-4 py-2 text-white hover:opacity-90"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--accent-ocean)]">
          One Piece TCG
        </p>
        <h1 className="font-display max-w-2xl text-4xl font-bold leading-tight text-[var(--ink-primary)] md:text-5xl">
          Brew decks from the cards you actually own
        </h1>
        <p className="mt-4 max-w-lg text-lg text-[var(--ink-muted)]">
          Track your binder, search like Limitless, and build named variations —
          all in one place.
        </p>
        <Link
          href="/signup"
          className="mt-8 rounded-xl bg-[var(--accent-pirate-red)] px-8 py-3 text-lg font-semibold text-white shadow-sm hover:opacity-90"
        >
          Set sail — create account
        </Link>
      </main>
    </div>
  );
}

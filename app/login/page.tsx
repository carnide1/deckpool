import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell title="Log in">
      <p className="mb-6 text-sm text-[var(--ink-muted)]">
        Full login form ships in Phase 7. Auth wiring is ready.
      </p>
      <Link
        href="/signup"
        className="text-sm font-medium text-[var(--accent-ocean)] hover:underline"
      >
        Need an account? Sign up
      </Link>
    </AuthPageShell>
  );
}

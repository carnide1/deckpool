import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function SignupPage() {
  return (
    <AuthPageShell title="Create account">
      <p className="mb-6 text-sm text-[var(--ink-muted)]">
        Signup with required display name ships in Phase 7. Auth wiring is ready.
      </p>
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--accent-ocean)] hover:underline"
      >
        Already have an account? Log in
      </Link>
    </AuthPageShell>
  );
}

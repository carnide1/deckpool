import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell title="Reset password">
      <p className="mb-6 text-sm text-[var(--ink-muted)]">
        Password reset form ships in Phase 7. Firebase reset is wired in AuthContext.
      </p>
      <Link
        href="/login"
        className="text-sm font-medium text-[var(--accent-ocean)] hover:underline"
      >
        Back to log in
      </Link>
    </AuthPageShell>
  );
}

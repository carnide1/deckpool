import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthPageShell
      title="Reset password"
      subtitle="We’ll email you a link to choose a new password."
    >
      <ForgotPasswordForm />
    </AuthPageShell>
  );
}

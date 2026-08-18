import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthPageShell
      title="Create account"
      subtitle="Open signup — email, password, and a display name."
    >
      <SignupForm />
    </AuthPageShell>
  );
}

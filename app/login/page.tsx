import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Log in"
      subtitle="Welcome back — pick up where you left off."
    >
      <LoginForm />
    </AuthPageShell>
  );
}

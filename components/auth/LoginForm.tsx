"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values.email.trim(), values.password);
      toast.success("Signed in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextInput
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-[var(--ink-muted)]">
        <Link
          href="/forgot-password"
          className="font-medium text-[var(--accent-ocean)] hover:underline"
        >
          Forgot password?
        </Link>
      </p>
      <p className="text-center text-sm text-[var(--ink-muted)]">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--accent-ocean)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

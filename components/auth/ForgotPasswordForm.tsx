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
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetPassword(values.email.trim());
      toast.success(
        "If an account exists for that email, a reset link is on the way.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send reset email",
      );
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <p className="text-sm text-[var(--ink-muted)]">
        Enter your email and we&apos;ll send a link to reset your password.
      </p>
      <TextInput
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-[var(--ink-muted)]">
        <Link
          href="/login"
          className="font-medium text-[var(--accent-ocean)] hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </form>
  );
}

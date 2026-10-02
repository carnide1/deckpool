"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { normalizeUsername, validateUsername } from "@/lib/usernames";

const schema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display name must be at least 2 characters")
      .max(40, "Display name is too long"),
    username: z
      .string()
      .transform(normalizeUsername)
      .superRefine((value, ctx) => {
        const message = validateUsername(value);
        if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function SignupForm() {
  const { signup } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { usernameError } = await signup(
        values.email.trim(),
        values.password,
        values.displayName.trim(),
        values.username,
      );
      if (usernameError) {
        toast.success(
          `Account created. ${usernameError} Pick a username on Friends.`,
          { duration: 6000 },
        );
      } else {
        toast.success("Account created");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign up failed");
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
      <TextInput
        label="Display name"
        autoComplete="name"
        error={errors.displayName?.message}
        {...register("displayName")}
      />
      <TextInput
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="e.g. strawhat_luffy"
        error={errors.username?.message}
        {...register("username")}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <TextInput
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-[var(--ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--accent-ocean)] hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

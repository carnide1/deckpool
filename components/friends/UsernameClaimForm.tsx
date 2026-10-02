"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { normalizeUsername, validateUsername } from "@/lib/usernames";

const schema = z.object({
  username: z
    .string()
    .transform(normalizeUsername)
    .superRefine((value, ctx) => {
      const message = validateUsername(value);
      if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function UsernameClaimForm({
  initialValue = "",
  submitLabel = "Save username",
  onDone,
}: {
  initialValue?: string;
  submitLabel?: string;
  onDone?: (username: string) => void;
}) {
  const { claimUsername } = useUserProfile();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: initialValue },
  });

  const onSubmit = handleSubmit(async ({ username }) => {
    try {
      const saved = await claimUsername(username);
      toast.success(`You're @${saved}`);
      onDone?.(saved);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save username.";
      setError("username", { message });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <TextInput
        label="Username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="e.g. strawhat_luffy"
        error={errors.username?.message}
        {...register("username")}
      />
      <p className="text-xs text-[var(--ink-muted)]">
        3–20 characters: letters, numbers, _ or . — friends add you by this exact
        name.
      </p>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

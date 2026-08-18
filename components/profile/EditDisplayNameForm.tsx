"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useUserProfile } from "@/contexts/UserProfileContext";

const schema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(40, "Display name is too long"),
});

type FormValues = z.infer<typeof schema>;

export function EditDisplayNameForm() {
  const { profile, saveDisplayName } = useUserProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: profile?.displayName ?? "" },
  });

  useEffect(() => {
    reset({ displayName: profile?.displayName ?? "" });
  }, [profile?.displayName, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await saveDisplayName(values.displayName);
      toast.success("Display name updated");
      reset({ displayName: values.displayName.trim() });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update name",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <TextInput
        label="Display name"
        error={errors.displayName?.message}
        {...register("displayName")}
      />
      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}

import { forwardRef, useId, type InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    {
      label,
      error,
      id,
      className = "",
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = id ?? props.name ?? generatedId;
    const errorId = `${inputId}-error`;
    const describedBy = [ariaDescribedBy, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <label className="flex min-w-0 flex-col gap-1.5 text-sm">
        {label ? (
          <span className="font-medium text-[var(--ink-primary)]">{label}</span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : ariaInvalid}
          className={[
            "h-10 w-full min-w-0 rounded-lg border bg-white px-3 text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]",
            error
              ? "border-[var(--accent-pirate-red)]"
              : "border-[var(--bg-inset)] focus:border-[var(--accent-ocean)] focus:outline-none",
            className,
          ].join(" ")}
          {...props}
        />
        {error ? (
          <span
            id={errorId}
            role="alert"
            className="text-xs text-[var(--accent-pirate-red)]"
          >
            {error}
          </span>
        ) : null}
      </label>
    );
  },
);

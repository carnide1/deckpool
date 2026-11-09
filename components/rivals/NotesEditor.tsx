"use client";

import {
  useId,
  useRef,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";
import { List } from "lucide-react";

type NotesEditorProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
};

/** Plain notes with a bullet helper (inserts • and continues on Enter). */
export function NotesEditor({
  label,
  value,
  onChange,
  error,
  id,
  className = "",
  disabled,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: NotesEditorProps) {
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const errorId = `${inputId}-error`;
  const describedBy =
    [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  const ref = useRef<HTMLTextAreaElement>(null);

  const insertBullet = () => {
    const el = ref.current;
    if (!el || disabled) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const atLineStart = start === 0 || before.endsWith("\n");
    const insertion = atLineStart ? "• " : "\n• ";
    const next = `${before}${insertion}${after}`;
    onChange(next);
    const cursor = start + insertion.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    props.onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey) {
      return;
    }
    const el = event.currentTarget;
    const start = el.selectionStart ?? 0;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const line = value.slice(lineStart, start);
    const bulletMatch = line.match(/^(\s*)([•\-*])\s+/);
    if (!bulletMatch) return;

    event.preventDefault();
    // Empty bullet line → leave the list.
    if (line.trim() === `${bulletMatch[2]}`) {
      const before = value.slice(0, lineStart);
      const after = value.slice(start);
      onChange(`${before}${after}`);
      requestAnimationFrame(() => {
        el.setSelectionRange(lineStart, lineStart);
      });
      return;
    }

    const indent = bulletMatch[1] ?? "";
    const insertion = `\n${indent}• `;
    const before = value.slice(0, start);
    const after = value.slice(el.selectionEnd ?? start);
    onChange(`${before}${insertion}${after}`);
    const cursor = start + insertion.length;
    requestAnimationFrame(() => {
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm">
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="font-medium text-[var(--ink-primary)]"
          >
            {label}
          </label>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={insertBullet}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--bg-inset)] px-2 py-1 text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--ink-primary)] disabled:opacity-40"
          aria-label="Insert bullet point"
        >
          <List className="h-3.5 w-3.5" />
          Bullet
        </button>
      </div>
      <textarea
        {...props}
        ref={ref}
        id={inputId}
        value={value}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={error ? true : ariaInvalid}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={[
          "min-h-28 w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-base text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]",
          error
            ? "border-[var(--accent-pirate-red)]"
            : "border-[var(--bg-inset)] focus:border-[var(--accent-ocean)] focus:outline-none",
          className,
        ].join(" ")}
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
    </div>
  );
}

/** Render plain notes with • / - lines as a list. */
export function NotesDisplay({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">No notes.</p>
    );
  }

  const lines = trimmed.split("\n");
  const blocks: { type: "p" | "ul"; lines: string[] }[] = [];
  for (const line of lines) {
    const bullet = line.match(/^\s*[•\-*]\s+(.*)$/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.lines.push(bullet[1] ?? "");
      else blocks.push({ type: "ul", lines: [bullet[1] ?? ""] });
    } else if (line.trim() === "") {
      blocks.push({ type: "p", lines: [""] });
    } else {
      const last = blocks[blocks.length - 1];
      if (last?.type === "p" && last.lines[last.lines.length - 1] !== "") {
        last.lines[last.lines.length - 1] += `\n${line}`;
      } else {
        blocks.push({ type: "p", lines: [line] });
      }
    }
  }

  return (
    <div className="space-y-2 text-sm text-[var(--ink-primary)]">
      {blocks.map((block, index) =>
        block.type === "ul" ? (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.lines.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        ) : block.lines[0] === "" ? (
          <div key={index} className="h-2" />
        ) : (
          <p key={index} className="whitespace-pre-wrap">
            {block.lines[0]}
          </p>
        ),
      )}
    </div>
  );
}

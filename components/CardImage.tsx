"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { displayImageCandidates } from "@/lib/cardImageUrl";

type CardImageProps = {
  src: string;
  alt: string;
  /** Extra catalog URLs to try if `src` fails to load. */
  fallbackSrcs?: string[];
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

const SAME_URL_RETRIES = 1;

/**
 * Card art via next/image → `/_next/image` (same-origin), which sidesteps
 * Bandai Cross-Origin-Resource-Policy blocks on direct hotlinks.
 *
 * Load order still comes from displayImageCandidates: optional mirror first,
 * then Bandai (and other catalog scans). One retry per URL, then next
 * candidate; Retry control after exhaustion.
 */
export function CardImage({
  src,
  alt,
  fallbackSrcs = [],
  width = 140,
  height = 196,
  className = "",
  priority = false,
}: CardImageProps) {
  const fallbackKey = fallbackSrcs.join("\0");
  const candidates = useMemo(
    () => displayImageCandidates([src, ...fallbackSrcs]),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by fallbackKey
    [src, fallbackKey],
  );
  const candidateKey = candidates.join("\0");

  const [index, setIndex] = useState(0);
  const [sameUrlRetry, setSameUrlRetry] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  const loadGenRef = useRef(0);
  const indexRef = useRef(0);
  const retryRef = useRef(0);
  const candidatesRef = useRef(candidates);
  candidatesRef.current = candidates;
  indexRef.current = index;
  retryRef.current = sameUrlRetry;

  useEffect(() => {
    loadGenRef.current += 1;
    indexRef.current = 0;
    retryRef.current = 0;
    setIndex(0);
    setSameUrlRetry(0);
    setExhausted(false);
  }, [candidateKey]);

  const current = exhausted ? undefined : candidates[index];
  const shellClass = [
    "rounded-md bg-[var(--bg-inset)] shadow-[var(--shadow-paper)]",
    className,
  ].join(" ");

  const resetLoads = () => {
    loadGenRef.current += 1;
    indexRef.current = 0;
    retryRef.current = 0;
    setIndex(0);
    setSameUrlRetry(0);
    setExhausted(false);
  };

  if (!current) {
    return (
      <div
        className={[
          "flex flex-col items-center justify-center gap-1 text-xs text-[var(--ink-muted)]",
          shellClass,
        ].join(" ")}
        style={{ width, minHeight: height }}
        role="img"
        aria-label={alt || "No art"}
      >
        <span>No art</span>
        {candidates.length > 0 ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              resetLoads();
            }}
            className="rounded px-1.5 py-0.5 font-semibold text-[var(--accent-ocean)] hover:underline"
          >
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    const gen = loadGenRef.current;
    const failedAttr = event.currentTarget.dataset.candidate;
    if (failedAttr !== String(indexRef.current)) return;

    queueMicrotask(() => {
      if (gen !== loadGenRef.current) return;

      const list = candidatesRef.current;
      const at = indexRef.current;
      const retries = retryRef.current;

      if (retries < SAME_URL_RETRIES) {
        const nextRetry = retries + 1;
        retryRef.current = nextRetry;
        setSameUrlRetry(nextRetry);
        return;
      }

      const next = at + 1;
      if (next >= list.length) {
        setExhausted(true);
        return;
      }
      indexRef.current = next;
      retryRef.current = 0;
      setIndex(next);
      setSameUrlRetry(0);
    });
  };

  return (
    <Image
      key={`${current}::${sameUrlRetry}`}
      src={current}
      alt={alt}
      width={width}
      height={height}
      data-candidate={String(index)}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      onError={handleError}
      className={["h-auto object-cover", shellClass].join(" ")}
    />
  );
}

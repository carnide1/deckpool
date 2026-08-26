"use client";

import { useEffect, useMemo, useState } from "react";
import { publicImageUrl } from "@/lib/cardPrefs";

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

function uniqueCandidates(primary: string, fallbacks: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of [primary, ...fallbacks]) {
    if (!raw) continue;
    const url = publicImageUrl(raw);
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * Hotlinked card art. Uses a plain img (not next/image) so Bandai requests
 * never go through /_next/image — that path burns Vercel Hobby transform quota
 * and was showing as broken tiles once the quota or upstream fetch failed.
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
    () => uniqueCandidates(src, fallbackSrcs),
    // fallbackSrcs identity changes every render when callers pass inline arrays
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by fallbackKey
    [src, fallbackKey],
  );
  const candidateKey = candidates.join("\0");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [candidateKey]);

  const current = candidates[index];
  const shellClass = [
    "rounded-md bg-[var(--bg-inset)] shadow-[var(--shadow-paper)]",
    className,
  ].join(" ");

  if (!current) {
    return (
      <div
        className={[
          "flex items-center justify-center text-xs text-[var(--ink-muted)]",
          shellClass,
        ].join(" ")}
        style={{ width, minHeight: height }}
        role="img"
        aria-label={alt}
      >
        No art
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- intentional: bypass Next image optimizer for hotlinked Bandai art
    <img
      key={current}
      src={current}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => setIndex((i) => i + 1)}
      className={["h-auto object-cover", shellClass].join(" ")}
    />
  );
}

"use client";

import Image from "next/image";

type CardImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function CardImage({
  src,
  alt,
  width = 140,
  height = 196,
  className = "",
  priority = false,
}: CardImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={[
        "rounded-md bg-[var(--bg-inset)] object-cover shadow-[var(--shadow-paper)]",
        className,
      ].join(" ")}
    />
  );
}

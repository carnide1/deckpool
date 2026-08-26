import type { NextConfig } from "next";

type ImageRemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

/**
 * Optional art mirror allowlist (only needed if something still uses next/image
 * against the mirror host). Card grids use /card-art or plain mirror <img>.
 */
function mirrorRemotePattern(): ImageRemotePattern | null {
  const raw = process.env.NEXT_PUBLIC_CARD_IMAGE_ORIGIN?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const pattern: ImageRemotePattern = {
      protocol: parsed.protocol === "http:" ? "http" : "https",
      hostname: parsed.hostname,
      pathname: "/**",
    };
    if (parsed.port) pattern.port = parsed.port;
    return pattern;
  } catch {
    return null;
  }
}

const mirror = mirrorRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "en.onepiece-cardgame.com",
        pathname: "/images/**",
      },
      ...(mirror ? [mirror] : []),
    ],
  },
};

export default nextConfig;

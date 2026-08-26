import type { NextConfig } from "next";

type ImageRemotePattern = {
  protocol?: "http" | "https";
  hostname: string;
  port?: string;
  pathname?: string;
};

/**
 * Optional art mirror (same env as the client). Allows /_next/image to fetch
 * from that host when NEXT_PUBLIC_CARD_IMAGE_ORIGIN is set at build time.
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
    // Browser loads /_next/image on our origin (avoids Bandai CORP blocking
    // cross-site <img>). Optimizer fetches Bandai/mirror server-side.
    // When a mirror CDN is configured, prefer it via CardImage candidates to
    // cut Bandai traffic and Hobby image-transform usage.
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

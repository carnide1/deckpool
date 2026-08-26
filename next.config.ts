import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hotlinked Bandai art: skip Vercel/Next optimization so grids do not burn
    // Hobby transform quota and do not fail with broken /_next/image responses.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "en.onepiece-cardgame.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;

import { NextRequest, NextResponse } from "next/server";

const BANDAI_HOST = "en.onepiece-cardgame.com";
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Same-origin card art proxy.
 *
 * Direct Bandai <img> is blocked by CORP in Chrome. Vercel /_next/image returns
 * 402 once Hobby image-optimization quota is exhausted. This route fetches
 * Bandai server-side and serves bytes from our origin (no Image Optimization).
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) {
    return new NextResponse("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" || target.hostname !== BANDAI_HOST) {
    return new NextResponse("Host not allowed", { status: 400 });
  }
  if (!target.pathname.startsWith("/images/")) {
    return new NextResponse("Path not allowed", { status: 400 });
  }

  // Normalize: drop unexpected credentials/hash; keep pathname (+ search if any).
  const upstreamUrl = `https://${BANDAI_HOST}${target.pathname}${target.search}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://en.onepiece-cardgame.com/",
        "User-Agent":
          "Mozilla/5.0 (compatible; DeckPool/1.0; +https://github.com/carnide1/deckpool)",
      },
      // Cache at the platform edge when possible.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
  } catch {
    return new NextResponse("Upstream fetch failed", { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(`Upstream ${upstream.status}`, {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    return new NextResponse("Upstream was not an image", { status: 502 });
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
    return new NextResponse("Upstream image size rejected", { status: 502 });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}

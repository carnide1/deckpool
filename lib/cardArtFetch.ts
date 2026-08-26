import { createHash } from "node:crypto";
import {
  bandaiUpstreamUrl,
  isSafeCardArtFile,
} from "@/lib/cardArtPath";

const MAX_BYTES = 4 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

export type CardArtPayload = {
  body: Buffer;
  contentType: string;
  etag: string;
};

const inflight = new Map<string, Promise<CardArtPayload>>();

function etagFor(body: Buffer): string {
  const digest = createHash("sha256").update(body).digest("hex").slice(0, 32);
  return `"${digest}"`;
}

async function fetchBandaiArt(file: string): Promise<CardArtPayload> {
  if (!isSafeCardArtFile(file)) {
    throw Object.assign(new Error("Unsafe file"), { status: 400 });
  }

  const upstreamUrl = bandaiUpstreamUrl(file);
  const upstream = await fetch(upstreamUrl, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "https://en.onepiece-cardgame.com/cardlist/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    // Edge/platform cache when available.
    next: { revalidate: 60 * 60 * 24 * 30 },
  });

  if (!upstream.ok) {
    throw Object.assign(new Error(`Upstream ${upstream.status}`), {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  const contentType = upstream.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    throw Object.assign(new Error("Upstream was not an image"), {
      status: 502,
    });
  }

  const body = Buffer.from(await upstream.arrayBuffer());
  if (body.byteLength === 0 || body.byteLength > MAX_BYTES) {
    throw Object.assign(new Error("Upstream image size rejected"), {
      status: 502,
    });
  }

  return { body, contentType, etag: etagFor(body) };
}

/** Load card art, coalescing concurrent requests for the same file in this isolate. */
export function loadCardArt(file: string): Promise<CardArtPayload> {
  const existing = inflight.get(file);
  if (existing) return existing;

  const pending = fetchBandaiArt(file).finally(() => {
    inflight.delete(file);
  });
  inflight.set(file, pending);
  return pending;
}

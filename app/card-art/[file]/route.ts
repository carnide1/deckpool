import { NextRequest, NextResponse } from "next/server";
import { loadCardArt } from "@/lib/cardArtFetch";
import { isSafeCardArtFile } from "@/lib/cardArtPath";

type RouteContext = {
  params: Promise<{ file: string }>;
};

/**
 * Same-origin card art proxy: `/card-art/OP17-001.png`
 *
 * Avoids Bandai CORP on direct <img> and Vercel Image Optimization 402s.
 * Path-shaped URLs cache cleanly; filenames are strictly allowlisted.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { file: rawFile } = await context.params;
  let file: string;
  try {
    file = decodeURIComponent(rawFile);
  } catch {
    return new NextResponse("Invalid file", { status: 400 });
  }

  if (!isSafeCardArtFile(file)) {
    return new NextResponse("File not allowed", { status: 400 });
  }

  const ifNoneMatch = request.headers.get("if-none-match");

  try {
    const art = await loadCardArt(file);
    if (ifNoneMatch && ifNoneMatch === art.etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: art.etag,
          "Cache-Control":
            "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        },
      });
    }

    return new NextResponse(new Uint8Array(art.body), {
      status: 200,
      headers: {
        "Content-Type": art.contentType,
        ETag: art.etag,
        "Cache-Control":
          "public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400",
        "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 502;
    const message =
      error instanceof Error ? error.message : "Upstream fetch failed";
    return new NextResponse(message, { status });
  }
}

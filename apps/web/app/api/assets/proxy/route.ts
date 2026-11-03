import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_HOSTS = new Set(["opendoodles.s3-us-west-1.amazonaws.com", "fonts.gstatic.com"]);
const MAX_BYTES = 4 * 1024 * 1024;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) return NextResponse.json({ error: "Missing asset URL" }, { status: 400 });

  let remote: URL;
  try {
    remote = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid asset URL" }, { status: 400 });
  }

  const extension = remote.pathname.toLowerCase().split(".").pop();
  const isDoodle = remote.hostname === "opendoodles.s3-us-west-1.amazonaws.com";
  const isMaterialIcon = remote.hostname === "fonts.gstatic.com" && /^\/s\/i\/short-term\/release\/materialsymbolsoutlined\/[a-z0-9_]+\/default\/24px\.svg$/i.test(remote.pathname);
  if (remote.protocol !== "https:" || !ALLOWED_HOSTS.has(remote.hostname) || !["svg", "gif"].includes(extension ?? "") || (!isDoodle && !isMaterialIcon)) {
    return NextResponse.json({ error: "Asset source is not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(remote.toString(), {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "image/svg+xml, image/gif" },
      redirect: "error",
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: "The illustration source is temporarily unavailable" }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const declaredLength = Number(upstream.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BYTES) {
      return NextResponse.json({ error: "Illustration is too large" }, { status: 413 });
    }

    if (extension === "gif") {
      const bytes = await upstream.arrayBuffer();
      if (bytes.byteLength > MAX_BYTES) {
        return NextResponse.json({ error: "Animation is too large" }, { status: 413 });
      }
      const header = String.fromCharCode(...new Uint8Array(bytes.slice(0, 6)));
      if (header !== "GIF87a" && header !== "GIF89a") {
        return NextResponse.json({ error: "Invalid GIF animation" }, { status: 415 });
      }
      return new NextResponse(bytes, {
        headers: {
          "Content-Type": "image/gif",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const source = (await upstream.text()).replace(/^\uFEFF/, "");
    if (source.length > MAX_BYTES) {
      return NextResponse.json({ error: "Illustration is too large" }, { status: 413 });
    }
    // SVG files may include an XML declaration, comments or a doctype before the root.
    // Extract the actual document instead of assuming a specific byte at the start.
    const svgStart = source.search(/<svg(?:\s|>)/i);
    const svgEnd = source.toLowerCase().lastIndexOf("</svg>");
    if (svgStart < 0 || svgEnd < svgStart) {
      return NextResponse.json({ error: "The asset source did not contain an SVG document", contentType: upstream.headers.get("content-type") }, { status: 415 });
    }
    const svgSource = source.slice(svgStart, svgEnd + 6);
    const safeSvg = svgSource
      .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
      .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/(?:href|xlink:href)\s*=\s*("|')\s*(?:https?:|javascript:|data:text\/html)[\s\S]*?\1/gi, "");

    return new NextResponse(safeSvg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Could not load illustration right now" }, { status: 502 });
  }
}

import { NextResponse } from "next/server";

export const revalidate = 86400;

export async function GET() {
  try {
    const response = await fetch("https://fonts.google.com/metadata/fonts", {
      headers: { "User-Agent": "Mozilla/5.0 SlideAIStudio/1.0", Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error(`Google Fonts metadata returned ${response.status}`);
    const raw = await response.text();
    const jsonStart = raw.indexOf("{");
    if (jsonStart < 0) throw new Error("Google Fonts metadata response was not JSON");
    const data = JSON.parse(raw.slice(jsonStart)) as { familyMetadataList?: Array<{ family?: string }> };
    const families = [...new Set((data.familyMetadataList ?? []).map((item) => item.family).filter((family): family is string => Boolean(family)))].sort((a,b) => a.localeCompare(b));
    if (!families.length) throw new Error("Google Fonts catalogue was empty");
    return NextResponse.json({ families, source: "Google Fonts", count: families.length }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    console.error("Google Fonts catalogue error:", error);
    return NextResponse.json({ error: "Google Fonts catalogue is temporarily unavailable" }, { status: 503 });
  }
}

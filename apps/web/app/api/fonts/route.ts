import { NextResponse } from "next/server";

type GoogleFontMeta = { family?: string; variants?: string[]; fonts?: Record<string, unknown>; axes?: Array<{ tag?: string; min?: number; max?: number }> };

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
    const data = JSON.parse(raw.slice(jsonStart)) as { familyMetadataList?: GoogleFontMeta[] };
    const items = data.familyMetadataList ?? [];
    const weightsByFamily: Record<string, number[]> = {};
    for (const item of items) {
      if (!item.family) continue;
      const axis = item.axes?.find((entry) => entry.tag === "wght");
      const listed = (item.variants ?? Object.keys(item.fonts ?? {})).filter((variant) => !variant.toLowerCase().endsWith("italic")).map((variant) => variant.replace(/[^0-9]/g, "")).filter(Boolean).map(Number).filter(Number.isFinite);
      const weights = axis ? [100,200,300,400,500,600,700,800,900].filter((weight) => weight >= (axis.min ?? 100) && weight <= (axis.max ?? 900)) : [...new Set(listed)];
      weightsByFamily[item.family] = weights.length ? weights.sort((a,b)=>a-b) : [400];
    }
    const families = Object.keys(weightsByFamily).sort((a,b) => a.localeCompare(b));
    if (!families.length) throw new Error("Google Fonts catalogue was empty");
    return NextResponse.json({ families, weightsByFamily, source: "Google Fonts", count: families.length }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
  } catch (error) {
    console.error("Google Fonts catalogue error:", error);
    return NextResponse.json({ error: "Google Fonts catalogue is temporarily unavailable" }, { status: 503 });
  }
}

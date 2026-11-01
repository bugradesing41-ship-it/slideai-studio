import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";

type ExportSlide = {
  id: number;
  eyebrow?: string;
  title?: string;
  body?: string;
};

type ExportRequest = {
  title?: string;
  theme?: "violet" | "blue" | "light";
  slides?: ExportSlide[];
  slideBackgrounds?: Record<number, string>;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ExportRequest;
    if (!Array.isArray(payload.slides) || payload.slides.length === 0 || payload.slides.length > 100) {
      return new Response("Geçerli bir sunum için 1–100 slayt gerekli.", { status: 400 });
    }

    const title = (payload.title || "SlideAI presentation").slice(0, 200);
    const theme = payload.theme || "violet";
    const backgrounds = payload.slideBackgrounds || {};
    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "SlideAI Studio";
    pptx.subject = "Editable presentation";
    pptx.title = title;
    pptx.company = "SlideAI Studio";

    payload.slides.forEach((item, index) => {
      const slide = pptx.addSlide();
      const slideBg = backgrounds[item.id] || (theme === "light" ? "#f1eee7" : theme === "blue" ? "#102333" : "#171525");
      slide.background = { color: slideBg.replace("#", "") };
      const light = theme === "light";
      const main = light ? "252333" : "F4F1FF";
      const muted = light ? "666174" : "BCB8CD";
      slide.addText((item.eyebrow || "").slice(0, 300), { x: 0.9, y: 0.8, w: 11.5, h: 0.35, fontFace: "Aptos", fontSize: 11, bold: true, charSpacing: 2, color: light ? "7558BC" : "B39BFF", margin: 0 });
      slide.addText((item.title || "").slice(0, 2000), { x: 0.85, y: 1.8, w: 11.6, h: 1.65, fontFace: "Aptos Display", fontSize: 34, bold: true, color: main, margin: 0.02, breakLine: false, fit: "shrink" });
      slide.addText((item.body || "").slice(0, 5000), { x: 0.9, y: 4.0, w: 9.8, h: 1.4, fontFace: "Aptos", fontSize: 17, color: muted, margin: 0.02, valign: "top", fit: "shrink" });
      slide.addText(`${String(index + 1).padStart(2, "0")} / ${String(payload.slides!.length).padStart(2, "0")}`, { x: 11.4, y: 6.85, w: 1.0, h: 0.25, fontFace: "Aptos", fontSize: 9, color: muted, align: "right", margin: 0 });
    });

    const file = await pptx.write({ outputType: "nodebuffer" });
    const bytes = new Uint8Array(file as ArrayBuffer);
    const safeName = title.trim().replace(/[^a-z0-9-_]+/gi, "-") || "slideai-presentation";
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeName}.pptx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("PowerPoint export failed:", error);
    return new Response("PowerPoint dosyası oluşturulurken sunucu hatası oluştu.", { status: 500 });
  }
}

import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";

type ExportSlide = {
  id: number;
  eyebrow?: string;
  title?: string;
  body?: string;
};

type FabricObject = {
  type?: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  opacity?: number;
  fill?: unknown;
  stroke?: unknown;
  strokeWidth?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontStyle?: string;
  underline?: boolean;
  linethrough?: boolean;
  textAlign?: string;
  charSpacing?: number;
  backgroundColor?: string;
  src?: string;
  path?: unknown[][];
  points?: { x: number; y: number }[];
  objects?: FabricObject[];
};

type PptxSlideLike = {
  background: { color: string };
  addImage(options: Record<string, unknown>): unknown;
  addText(text: string, options: Record<string, unknown>): unknown;
  addShape(shape: string, options: Record<string, unknown>): unknown;
};

type ExportRequest = {
  title?: string;
  theme?: "violet" | "blue" | "light";
  slides?: ExportSlide[];
  slideBackgrounds?: Record<number, string>;
  canvasDataBySlide?: Record<number, string>;
  width?: number;
  height?: number;
};

const SLIDE_W = 13.333333;
let PX_TO_IN_X = SLIDE_W / 1280;
let PX_TO_IN_Y = 7.5 / 720;

function colorValue(value: unknown, fallback = "FFFFFF"): { color: string; transparency: number } {
  if (value && typeof value === "object") {
    const stops = (value as { colorStops?: { color?: string }[] }).colorStops;
    if (Array.isArray(stops) && stops.length > 0) return colorValue(stops[0].color, fallback);
  }
  if (typeof value !== "string") return { color: fallback, transparency: 0 };
  const hex = value.match(/#([0-9a-f]{6})/i)?.[1];
  if (hex) return { color: hex.toUpperCase(), transparency: 0 };
  const rgb = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgb) {
    const color = [rgb[1], rgb[2], rgb[3]].map((part) => Number(part).toString(16).padStart(2, "0")).join("").toUpperCase();
    const alpha = rgb[4] === undefined ? 1 : Math.max(0, Math.min(1, Number(rgb[4])));
    return { color, transparency: Math.round((1 - alpha) * 100) };
  }
  return { color: fallback, transparency: 0 };
}

function slideBackground(value: string | undefined, theme: string) {
  const fallback = theme === "light" ? "FFFFFF" : theme === "blue" ? "102333" : "171525";
  if (!value) return fallback;
  const firstGradientColor = value.startsWith("gradient:") ? value.slice(9).split(",")[0] : value;
  return colorValue(firstGradientColor, fallback).color;
}

function addGradientBackground(slide: PptxSlideLike, value: string | undefined) {
  if (!value?.startsWith("gradient:")) return;
  const colors = value.slice(9).split(",").filter((color) => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 3);
  if (colors.length < 2) return;
  const stops = colors.map((color, index) => `<stop offset="${Math.round((index / (colors.length - 1)) * 100)}%" stop-color="${color}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs><rect width="1600" height="900" fill="url(#bg)"/></svg>`;
  slide.addImage({ data: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`, x: 0, y: 0, w: SLIDE_W, h: SLIDE_W * 720 / 1280 });
}

async function readCanvasObjects(serialized: string | undefined): Promise<FabricObject[]> {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized) as { objects?: FabricObject[] };
    const objects = Array.isArray(parsed.objects) ? parsed.objects : [];
    const inlineRemoteImages = async (object: FabricObject): Promise<void> => {
      if (String(object.type ?? "").toLowerCase() === "image" && typeof object.src === "string" && object.src.startsWith("https://")) {
        try {
          const url = new URL(object.src);
          if (url.hostname === "opendoodles.s3-us-west-1.amazonaws.com") {
            const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
            const mime = (response.headers.get("content-type") || "").split(";")[0].toLowerCase();
            if (response.ok && ["image/svg+xml", "image/png", "image/jpeg", "image/webp"].includes(mime)) {
              const bytes = Buffer.from(await response.arrayBuffer());
              if (bytes.byteLength <= 8 * 1024 * 1024) object.src = `data:${mime};base64,${bytes.toString("base64")}`;
            }
          }
        } catch {
          // Keep the rest of the slide exportable if an optional remote illustration is unavailable.
        }
      }
      if (object.objects?.length) await Promise.all(object.objects.map(inlineRemoteImages));
    };
    await Promise.all(objects.map(inlineRemoteImages));
    return objects;
  } catch {
    return [];
  }
}

function renderFabricObject(
  slide: PptxSlideLike,
  object: FabricObject,
  parentX = 0,
  parentY = 0,
  parentScaleX = 1,
  parentScaleY = 1,
) {
  const type = String(object.type ?? "").toLowerCase();
  const left = parentX + (Number(object.left) || 0) * parentScaleX;
  const top = parentY + (Number(object.top) || 0) * parentScaleY;
  const scaleX = parentScaleX * (Number(object.scaleX) || 1);
  const scaleY = parentScaleY * (Number(object.scaleY) || 1);
  const widthPx = Math.max(0, (Number(object.width) || 0) * scaleX);
  const heightPx = Math.max(0, (Number(object.height) || 0) * scaleY);
  const x = left * PX_TO_IN_X;
  const y = top * PX_TO_IN_Y;
  const w = widthPx * PX_TO_IN_X;
  const h = heightPx * PX_TO_IN_Y;
  const opacity = Math.max(0, Math.min(1, Number(object.opacity ?? 1)));
  const fill = colorValue(object.fill, "FFFFFF");
  const stroke = colorValue(object.stroke, fill.color);
  const lineWidth = Math.max(0, Number(object.strokeWidth) || 0) * 0.75;
  const rotation = Number(object.angle) || 0;

  if (type === "group" || type === "activeselection") {
    object.objects?.forEach((child) => renderFabricObject(slide, child, left, top, scaleX, scaleY));
    return;
  }

  if (type === "image") {
    if (typeof object.src === "string" && object.src.startsWith("data:image/") && w > 0 && h > 0) {
      slide.addImage({
        data: object.src,
        x,
        y,
        w,
        h,
        rotate: rotation,
        transparency: Math.round((1 - opacity) * 100),
      });
    }
    return;
  }

  if (["textbox", "i-text", "text"].includes(type)) {
    const text = String(object.text ?? "");
    if (!text.trim() || w <= 0 || h <= 0) return;
    const textOptions: Record<string, unknown> = {
      x, y, w, h,
      fontFace: object.fontFamily || "Aptos",
      fontSize: Math.max(6, (Number(object.fontSize) || 24) * 0.75),
      bold: typeof object.fontWeight === "number" ? object.fontWeight >= 600 : object.fontWeight === "bold",
      italic: object.fontStyle === "italic",
      underline: Boolean(object.underline),
      strike: Boolean(object.linethrough),
      color: colorValue(object.fill, "FFFFFF").color,
      transparency: Math.round((1 - opacity) * 100),
      align: object.textAlign === "center" || object.textAlign === "right" ? object.textAlign : "left",
      valign: "mid",
      margin: 0,
      breakLine: false,
      fit: "shrink",
      rotate: rotation,
      charSpacing: Math.max(0, Number(object.charSpacing) || 0) / 100,
    };
    if (object.stroke && lineWidth > 0) {
      textOptions.outline = { color: stroke.color, width: lineWidth, transparency: stroke.transparency };
    }
    if (object.backgroundColor) {
      const bg = colorValue(object.backgroundColor, "FFFFFF");
      textOptions.fill = { color: bg.color, transparency: bg.transparency };
    }
    slide.addText(text, textOptions);
    return;
  }

  if ((type === "path" && Array.isArray(object.path) && object.path.length > 0) || (type === "polygon" && Array.isArray(object.points) && object.points.length > 2)) {
    const pathData = type === "polygon"
      ? `M ${object.points!.map((point) => `${point.x} ${point.y}`).join(" L ")} Z`
      : object.path!.map((command) => command.join(" ")).join(" ");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(1, Math.round(widthPx))}" height="${Math.max(1, Math.round(heightPx))}" viewBox="0 0 ${Math.max(1, Number(object.width) || 1)} ${Math.max(1, Number(object.height) || 1)}"><path d="${pathData}" fill="${object.fill ? "#" + fill.color : "none"}" fill-opacity="${opacity}" stroke="${object.stroke ? "#" + stroke.color : "none"}" stroke-width="${Math.max(0, Number(object.strokeWidth) || 0)}"/></svg>`;
    slide.addImage({
      data: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
      x, y, w, h, rotate: rotation,
    });
    return;
  }

  const shapeTypes: Record<string, string> = {
    rect: "rect",
    ellipse: "ellipse",
    triangle: "triangle",
    line: "line",
  };
  const shape = shapeTypes[type];
  if (!shape) return;
  slide.addShape(shape, {
    x, y, w: Math.max(0.01, w), h: Math.max(0.01, h),
    rotate: rotation,
    fill: { color: fill.color, transparency: Math.min(100, fill.transparency + Math.round((1 - opacity) * 100)) },
    line: object.stroke && lineWidth > 0
      ? { color: stroke.color, width: lineWidth, transparency: stroke.transparency }
      : { color: fill.color, transparency: 100, width: 0.1 },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ExportRequest;
    const slides = payload.slides;
    if (!Array.isArray(slides) || slides.length === 0 || slides.length > 100) {
      return new Response("Geçerli bir sunum için 1–100 slayt gerekli.", { status: 400 });
    }

    const title = (payload.title || "SlideAI presentation").slice(0, 200);
    const theme = payload.theme || "light";
    const backgrounds = payload.slideBackgrounds || {};
    const canvasData = payload.canvasDataBySlide || {};
    const exportWidth = Math.max(320, Math.min(4096, Math.round(payload.width || 1280)));
    const exportHeight = Math.max(320, Math.min(4096, Math.round(payload.height || 720)));
    const slideHeightIn = SLIDE_W * exportHeight / exportWidth;
    PX_TO_IN_X = SLIDE_W / 1280;
    PX_TO_IN_Y = slideHeightIn / 720;
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "SLIDEAI_CUSTOM", width: SLIDE_W, height: slideHeightIn });
    pptx.layout = "SLIDEAI_CUSTOM";
    pptx.author = "SlideAI Studio";
    pptx.subject = "Editable presentation";
    pptx.title = title;
    pptx.company = "SlideAI Studio";

    for (const [index, item] of slides.entries()) {
      const slide = pptx.addSlide() as unknown as PptxSlideLike;
      slide.background = { color: slideBackground(backgrounds[item.id], theme) };
      addGradientBackground(slide, backgrounds[item.id]);
      const objects = await readCanvasObjects(canvasData[item.id]);
      if (objects.length > 0) {
        objects.forEach((object) => renderFabricObject(slide, object));
      } else {
        const light = theme === "light";
        const main = light ? "252333" : "F4F1FF";
        const muted = light ? "666174" : "BCB8CD";
        if (item.eyebrow?.trim()) {
          slide.addText(item.eyebrow.slice(0, 300), { x: 0.9, y: 0.8, w: 11.5, h: 0.35, fontFace: "Aptos", fontSize: 11, bold: true, charSpacing: 2, color: light ? "7558BC" : "B39BFF", margin: 0 });
        }
        if (item.title?.trim()) {
          slide.addText(item.title.slice(0, 2000), { x: 0.85, y: 1.8, w: 11.6, h: 1.65, fontFace: "Aptos Display", fontSize: 34, bold: true, color: main, margin: 0.02, breakLine: false, fit: "shrink" });
        }
        if (item.body?.trim()) {
          slide.addText(item.body.slice(0, 5000), { x: 0.9, y: 4.0, w: 9.8, h: 1.4, fontFace: "Aptos", fontSize: 17, color: muted, margin: 0.02, valign: "top", fit: "shrink" });
        }
        if (item.eyebrow?.trim() || item.title?.trim() || item.body?.trim()) {
          slide.addText(`${String(index + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`, { x: 11.4, y: 6.85, w: 1.0, h: 0.25, fontFace: "Aptos", fontSize: 9, color: muted, align: "right", margin: 0 });
        }
      }
    }

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

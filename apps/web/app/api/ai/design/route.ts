import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { deckSpecSchema, designTypeSchema } from "@slideai/shared";

export const runtime = "nodejs";
export const maxDuration = 90;

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(3000),
  designType: designTypeSchema,
  slideCount: z.number().int().min(1).max(12),
  mode: z.enum(["create", "refine"]),
  existingDeck: z.unknown().optional(),
  activeSlideId: z.number().int().positive().optional(),
});

const elementSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["text", "rect", "ellipse", "line", "triangle", "image-placeholder"] },
    role: { type: "string", enum: ["title", "eyebrow", "body", "label", "decorative"] },
    x: { type: "number" }, y: { type: "number" },
    width: { type: "number" }, height: { type: "number" },
    text: { type: "string" }, fill: { type: "string" }, stroke: { type: "string" },
    fontFamily: { type: "string" }, fontSize: { type: "number" }, fontWeight: { type: "integer" },
    textAlign: { type: "string", enum: ["left", "center", "right"] },
    opacity: { type: "number" },
  },
  required: ["id", "type", "role", "x", "y", "width", "height", "text", "fill", "stroke", "fontFamily", "fontSize", "fontWeight", "textAlign", "opacity"],
  additionalProperties: false,
} as const;

const slideSchema = {
  type: "object",
  properties: {
    id: { type: "integer" }, title: { type: "string" }, eyebrow: { type: "string" },
    body: { type: "string" }, kind: { type: "string", enum: ["cover", "content", "stats", "quote"] },
    layout: { type: "string", enum: ["title", "title-and-body", "three-statistics", "featured-quote", "two-column", "image-focus", "comparison", "timeline"] },
    notes: { type: "string" },
    elements: { type: "array", items: elementSchema, maxItems: 40 },
  },
  required: ["id", "title", "eyebrow", "body", "kind", "layout", "notes", "elements"],
  additionalProperties: false,
} as const;

const outputSchema = {
  type: "object",
  properties: {
    message: { type: "string" },
    deck: {
      type: "object",
      properties: {
        schemaVersion: { type: "string", enum: ["1.0"] },
        id: { type: "string" }, title: { type: "string" }, description: { type: "string" },
        theme: { type: "string", enum: ["violet", "blue", "light", "dark", "minimal", "corporate"] },
        designType: { type: "string", enum: ["presentation", "social-post", "advertisement", "product", "infographic"] },
        language: { type: "string" },
        slides: { type: "array", items: slideSchema, minItems: 1, maxItems: 12 },
        metadata: {
          type: "object", properties: { source: { type: "string", enum: ["ai"] } },
          required: ["source"], additionalProperties: false,
        },
      },
      required: ["schemaVersion", "id", "title", "description", "theme", "designType", "language", "slides", "metadata"],
      additionalProperties: false,
    },
  },
  required: ["message", "deck"],
  additionalProperties: false,
} as const;

const requestTimestamps = new Map<string, number[]>();
function allowRequest(key: string) {
  const now = Date.now();
  const recent = (requestTimestamps.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= 8) return false;
  recent.push(now);
  requestTimestamps.set(key, recent);
  return true;
}

const systemInstructions = `
You are SlideAI Studio's senior art director, presentation strategist and graphic designer.
Create professional, production-ready visual layouts, not generic text outlines.
Return only the requested structured design object. The canvas is exactly 1280 x 720 pixels.
Every slide must contain 3-14 meaningful, editable Fabric.js elements. Use text, rect, ellipse, line, triangle and image-placeholder elements only.
All coordinates must stay inside the 1280x720 canvas; keep a 56px safe margin. Element dimensions must be positive.
Use a clear typographic hierarchy, intentional negative space, strong alignment, contrast and a consistent palette.
Use Google Fonts family names such as Manrope, DM Sans, Space Grotesk, Playfair Display or Montserrat; use common available families.
Use actual concise copy, not filler. Use Turkish when the user's prompt is Turkish; otherwise follow the prompt's language.
Every slide needs an editable title element with role=title. Add an eyebrow or body element where appropriate.
For decorative shapes, set text to an empty string. Use hex colors. Do not invent image URLs. Use image-placeholder elements only where a real image would materially improve the design; these are editable placeholders, not generated photographs.
For product/ad/social designs, compose a single high-quality campaign layout if the requested design is not a presentation. Do not create a multi-slide deck unless the user explicitly asks for multiple variations/pages.
For presentations, make the opening slide compelling, vary layouts across slides, and avoid repeating the same composition. A statistics slide should visualize data with individual editable bars, labels and values; never invent factual metrics—mark illustrative values clearly in copy.
When refining an existing deck, preserve its topic, useful content, language and overall identity unless asked to change them. Apply the requested improvement while keeping every slide valid.
`;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip)) {
    return NextResponse.json({ error: "Çok fazla tasarım isteği gönderildi. Bir dakika sonra tekrar dene." }, { status: 429 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API anahtarı sunucuda tanımlı değil. Proje köküne .env.local ekleyip OPENAI_API_KEY değerini tanımla." }, { status: 503 });
  }

  try {
    const body = requestSchema.parse(await request.json());
    const existingDeck = body.mode === "refine" ? deckSpecSchema.safeParse(body.existingDeck) : null;
    if (body.mode === "refine" && !existingDeck?.success) {
      return NextResponse.json({ error: "Düzenlenecek geçerli bir sunum bulunamadı. Önce yeni bir tasarım oluştur." }, { status: 400 });
    }

    const designBrief = [
      `REQUEST TYPE: ${body.designType}`,
      `MODE: ${body.mode}`,
      `REQUESTED SLIDE COUNT: ${body.designType === "presentation" ? body.slideCount : 1}`,
      `USER BRIEF: ${body.prompt}`,
      body.mode === "refine" ? `EXISTING DECK TO REFINE: ${JSON.stringify(existingDeck?.data)}` : "",
      body.mode === "refine" && body.activeSlideId ? `The user currently has slide id ${body.activeSlideId} selected. Prioritize that slide unless the prompt asks for a deck-wide change.` : "",
    ].filter(Boolean).join("\n\n");

    const openai = new OpenAI({ apiKey, timeout: 85_000, maxRetries: 1 });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.5",
      store: false,
      max_output_tokens: 9000,
      instructions: systemInstructions,
      input: designBrief,
      text: {
        format: {
          type: "json_schema",
          name: "slideai_editable_design",
          strict: true,
          schema: outputSchema,
        },
      },
    });

    const output = response.output_text;
    if (!output) throw new Error("The design model returned an empty response.");
    const parsed = JSON.parse(output) as unknown;
    const resultSchema = z.object({ message: z.string().min(1).max(1000), deck: deckSpecSchema });
    const result = resultSchema.safeParse(parsed);
    if (!result.success) {
      console.error("AI design schema validation failed:", result.error.flatten());
      return NextResponse.json({ error: "AI tasarım çıktısı doğrulanamadı. Lütfen isteğini biraz daha açık yazarak tekrar dene." }, { status: 502 });
    }

    const deck = {
      ...result.data.deck,
      metadata: { source: "ai" as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    };
    return NextResponse.json({ message: result.data.message, deck, model: process.env.OPENAI_MODEL || "gpt-5.5" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "İstek bilgileri geçersiz. Komut en fazla 3000 karakter olabilir." }, { status: 400 });
    }
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI design request failed:", error.status, error.code, error.message);
      const status = error.status === 429 ? 429 : error.status === 401 ? 503 : 502;
      return NextResponse.json({ error: error.status === 429 ? "OpenAI kullanım limiti veya bakiyesi nedeniyle istek tamamlanamadı." : "OpenAI tasarım isteği tamamlanamadı. API anahtarını ve model erişimini kontrol et." }, { status });
    }
    console.error("AI design route error:", error);
    return NextResponse.json({ error: "Tasarım oluşturulurken beklenmeyen bir hata oluştu." }, { status: 500 });
  }
}

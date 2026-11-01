import { z } from "zod";

export const deckThemeSchema = z.enum(["violet", "blue", "light", "dark", "minimal", "corporate"]);
export const designTypeSchema = z.enum(["presentation", "social-post", "advertisement", "product", "infographic"]);
export const slideKindSchema = z.enum(["cover", "content", "stats", "quote"]);
export const slideLayoutSchema = z.enum([
  "title", "title-and-body", "three-statistics", "featured-quote", "two-column",
  "image-focus", "comparison", "timeline",
]);

export const designElementSchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum(["text", "rect", "ellipse", "line", "triangle", "image-placeholder"]),
  role: z.enum(["title", "eyebrow", "body", "label", "decorative"]),
  x: z.number().min(0).max(1280),
  y: z.number().min(0).max(720),
  width: z.number().min(1).max(1280),
  height: z.number().min(1).max(720),
  text: z.string().max(2000),
  fill: z.string().max(80),
  stroke: z.string().max(80),
  fontFamily: z.string().max(100),
  fontSize: z.number().min(8).max(180),
  fontWeight: z.number().int().min(100).max(900),
  textAlign: z.enum(["left", "center", "right"]),
  opacity: z.number().min(0).max(1),
}).superRefine((element, context) => {
  if (element.x + element.width > 1280) context.addIssue({ code: z.ZodIssueCode.custom, path: ["width"], message: "Element exceeds the canvas width." });
  if (element.y + element.height > 720) context.addIssue({ code: z.ZodIssueCode.custom, path: ["height"], message: "Element exceeds the canvas height." });
});

export const slideSpecSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(180),
  eyebrow: z.string().max(80).default(""),
  body: z.string().max(2400).default(""),
  kind: slideKindSchema.default("content"),
  layout: slideLayoutSchema.default("title-and-body"),
  notes: z.string().max(4000).optional(),
  elements: z.array(designElementSchema).max(40).default([]),
});

export const deckSpecSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(180),
  description: z.string().max(1000).default(""),
  theme: deckThemeSchema.default("violet"),
  designType: designTypeSchema.default("presentation"),
  language: z.string().min(2).max(16).default("en"),
  slides: z.array(slideSpecSchema).min(1).max(200),
  metadata: z.object({
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    source: z.enum(["manual", "ai", "import"]).default("manual"),
  }).default({ source: "manual" }),
}).superRefine((deck, context) => {
  const ids = new Set<number>();
  deck.slides.forEach((slide, index) => {
    if (ids.has(slide.id)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slides", index, "id"],
        message: `Duplicate slide id: ${slide.id}`,
      });
    }
    ids.add(slide.id);
  });
});

export type DeckSpec = z.infer<typeof deckSpecSchema>;
export type SlideSpec = z.infer<typeof slideSpecSchema>;
export type DeckTheme = z.infer<typeof deckThemeSchema>;
export type DesignType = z.infer<typeof designTypeSchema>;
export type DesignElement = z.infer<typeof designElementSchema>;

export function validateDeck(input: unknown) {
  return deckSpecSchema.safeParse(input);
}

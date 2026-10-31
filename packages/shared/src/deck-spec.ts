import { z } from "zod";

export const deckThemeSchema = z.enum(["violet", "blue", "light", "dark", "minimal", "corporate"]);
export const slideKindSchema = z.enum(["cover", "content", "stats", "quote"]);
export const slideLayoutSchema = z.enum([
  "title",
  "title-and-body",
  "three-statistics",
  "featured-quote",
  "two-column",
  "image-focus",
  "comparison",
  "timeline",
]);

export const slideSpecSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(180),
  eyebrow: z.string().max(80).default(""),
  body: z.string().max(2400).default(""),
  kind: slideKindSchema.default("content"),
  layout: slideLayoutSchema.default("title-and-body"),
  notes: z.string().max(4000).optional(),
});

export const deckSpecSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(180),
  description: z.string().max(1000).default(""),
  theme: deckThemeSchema.default("violet"),
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

export function validateDeck(input: unknown) {
  return deckSpecSchema.safeParse(input);
}

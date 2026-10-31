import type { DeckSpec } from "./deck-spec";

export const sampleDeck: DeckSpec = {
  schemaVersion: "1.0",
  id: "sample-ai-field-guide",
  title: "The next era of artificial intelligence",
  description: "A field guide to the changing relationship between people and intelligent systems.",
  theme: "violet",
  language: "en",
  metadata: { source: "manual" },
  slides: [
    {
      id: 1,
      title: "The next era of\nartificial intelligence",
      eyebrow: "A FIELD GUIDE · 2026",
      body: "How intelligent systems are reshaping the way we live, work and create.",
      kind: "cover",
      layout: "title",
    },
    {
      id: 2,
      title: "A new kind of intelligence",
      eyebrow: "01 — THE SHIFT",
      body: "AI is moving beyond automation. It is becoming a creative partner, a research assistant and an interface to knowledge.",
      kind: "content",
      layout: "title-and-body",
    },
    {
      id: 3,
      title: "The landscape is changing",
      eyebrow: "02 — MOMENTUM",
      body: "From personal assistants to scientific discovery, intelligent tools are finding a place in everyday workflows.",
      kind: "stats",
      layout: "three-statistics",
    },
    {
      id: 4,
      title: "The opportunity is human",
      eyebrow: "03 — THE BIG IDEA",
      body: "The most meaningful progress happens when human judgment meets machine capability.",
      kind: "quote",
      layout: "featured-quote",
    },
  ],
};

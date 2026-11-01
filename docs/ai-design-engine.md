# SlideAI Studio — AI Design Engine MVP

## Request lifecycle

1. The Studio chat collects a design category, create/refine mode, slide count and prompt.
2. The browser posts the brief to `POST /api/ai/design`; it never calls Gemini directly.
3. The Node.js route reads `OPENAI_API_KEY` from the server environment, validates the request and optionally validates the existing DeckSpec.
4. Google Gemini API Structured Outputs returns a strict JSON object containing a DeckSpec and a short assistant message.
5. The server validates the returned deck with the shared Zod schema, adds AI provenance timestamps and returns it to the client.
6. The client replaces the current deck and remounts Fabric.js. Each generated text or vector shape becomes an individual editable canvas object.

## Supported design types

- Presentation (3–12 slides)
- Social media post
- Advertisement
- Product layout
- Infographic

Non-presentation design types currently generate one 1280×720 artboard. Dedicated square, portrait and story dimensions are a planned next step.

## Editable element types

- Text: title, eyebrow, body, label and decorative text
- Rectangle, ellipse, line and triangle
- Image placeholder frames that can be selected and replaced later

Generated elements are bounded by the shared 1280×720 DeckSpec canvas limits. AI-generated photos and persistent asset uploads are not part of this first MVP.

## Local setup

Create `apps/web/.env.local` from `apps/web/.env.example` and set:

```env
GEMINI_API_KEY=your_google_ai_studio_api_key
GEMINI_MODEL=gemini-3.8-flash
```

Restart the dev server after changing environment variables.

## Security and production notes

- The Gemini API key is server-only and must never use a `NEXT_PUBLIC_` prefix.
- The route uses `store: false` for Responses API requests.
- Request body size and prompt length are bounded.
- Output is schema-validated before it reaches Fabric.
- A lightweight in-memory per-IP request limit protects development. Production must add authenticated users, durable distributed quotas, abuse monitoring and spend limits.
- No user deck is persisted to a database in this MVP.

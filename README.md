# SlideAI Studio

An AI-assisted presentation workspace built around conversational creation and a live slide editor.

> AI design MVP. The Studio now connects to the Google Gemini API through a server-side route and converts structured AI output into editable DeckSpec and Fabric.js canvas objects. Persistent projects, generated image assets and export services remain on the roadmap.

## Current features

- Premium dark workspace dashboard
- Three-panel Studio layout: AI chat, slide canvas and design inspector
- Select slides from the filmstrip and add, duplicate, delete and reorder slides
- Fabric.js canvas with object selection, move, resize and rotate controls
- Freehand pencil drawing and drag-to-size shapes: rectangle, ellipse, triangle, line, arrow, star, diamond, pentagon, hexagon, heart and speech bubble
- Editable canvas text with the live Google Fonts catalogue, family-specific font weights and on-demand Google Fonts CSS loading
- 25 text animation presets and 25 object animation presets; selecting a preset immediately previews it on the selected object without permanently applying it
- 25 typography effects and 25 visual-item effects
- Import PNG, JPG, WEBP, GIF and SVG images from the computer (up to 12 MB per file)
- Per-slide background color, adjustable corner radius for selected objects, rounded speech bubbles, and a quick-open character library
- 10 distinct slide entrance animations (fade, directional slide, rise, zoom, 3D flip, blur, wipe, rotate and bounce) and a Play all control
- Real slide numbering rendered on each slide (for example, 01 / 08), recalculated when slides are reordered or added
- Searchable visual asset library with Google Material Symbols icons, emoji stickers, 35+ illustrated Open Doodles character SVGs, signs, arrows, badges and business/lifestyle elements
- Fill, stroke, stroke width, opacity, soft shadow and visual style presets
- Object duplicate, delete and layer-order actions
- Per-slide canvas JSON state and local undo/redo history
- Motion-powered slide-switch preview transitions
- Responsive editor layout
- Gemini-powered design assistant for presentations, social posts, advertisements, product layouts and infographics
- Structured DeckSpec output with editable text, shapes, lines, image placeholders and layout elements
- Create-from-prompt and refine-current-design modes with server-side API key handling and schema validation

## Tech stack

- Next.js 15, React 19 and TypeScript
- CSS design system
- Lucide icons
- npm workspaces
- Google Gemini API (server-side REST integration)
- Zod validation and structured JSON Schema outputs

## Run locally

Requirements: Node.js 20.9+ and npm 10+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the dashboard and [http://localhost:3000/studio](http://localhost:3000/studio) for the editor.

## Project structure

```text
apps/
  web/
    app/
      page.tsx
      studio/
        page.tsx
        StudioWorkspace.tsx
        DesignCanvas.tsx
        AssetLibrary.tsx
packages/       # shared packages planned
docs/
  architecture.md
```

## Roadmap

See [docs/product-roadmap.md](docs/product-roadmap.md) for the staged product plan and [docs/editor-assets.md](docs/editor-assets.md) for editor packages and license policy.

## Security

Do not commit API keys, tokens, passwords or production secrets. Keep local environment files out of Git.


## Google design resources

- Google Fonts are loaded on demand from the live Google Fonts CSS service; the Studio font picker is backed by the Google Fonts metadata catalogue, rather than a short hard-coded list of bundled families. This requires an internet connection. The former Fontsource family packages have been removed.
- The asset library includes Google Material Symbols Outlined (Google Fonts Icons) alongside editable character/illustration assets.
- Text, product/object and slide entrance animations remain separate preview systems powered by Motion and the Fabric canvas animation engine. Slide numbering is derived from the active slide order and shown on the canvas and thumbnails.

## Gemini setup

1. Copy `apps/web/.env.example` to `apps/web/.env.local` (Next.js loads environment files from the web app directory).
2. Set `GEMINI_API_KEY` to an API key from Google AI Studio.
3. Optionally set `GEMINI_MODEL`; the default is `gemini-3.8-flash`.
4. Restart the Next.js development server and open `/studio`.

The browser calls only `/api/ai/design`. The Gemini key is read by the Node.js route from the server environment and is never returned to the client. The route validates requests, rate-limits each IP in-process, requests JSON structured output, and validates the result against the shared Zod DeckSpec before returning it. See [AI design engine](docs/ai-design-engine.md).

The current MVP generates editable text and vector shapes. Image areas are editable placeholders; direct AI image generation, authentication, persistent project storage, durable usage quotas and export are future increments. The in-memory IP limit is a development safeguard, not a substitute for production distributed rate limiting and user authentication.

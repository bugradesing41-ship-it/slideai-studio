# SlideAI Studio

An AI-assisted presentation workspace built around conversational creation and a live slide editor.

> Early development scaffold. The current Studio uses local sample content; AI generation, persistence and export services are not connected yet.

## Current features

- Premium dark workspace dashboard
- Three-panel Studio layout: AI chat, slide canvas and design inspector
- Select slides from the filmstrip and add, duplicate, delete and reorder slides
- Fabric.js canvas with object selection, move, resize and rotate controls
- Freehand pencil drawing and drag-to-size shapes: rectangle, ellipse, triangle, line, arrow, star, diamond, pentagon, hexagon, heart and speech bubble
- Editable canvas text with 16 locally bundled Google Fonts families, explicit variable-font face loading and selectable font weights
- 25 text animation presets and 25 object animation presets; selecting a preset immediately previews it on the selected object without permanently applying it
- 25 typography effects and 25 visual-item effects
- Import PNG, JPG, WEBP, GIF and SVG images from the computer (up to 12 MB per file)
- Per-slide background color, adjustable corner radius for selected objects, rounded speech bubbles, and a quick-open character library
- 10 distinct slide entrance animations (fade, directional slide, rise, zoom, 3D flip, blur, wipe, rotate and bounce) and a Play all control
- Real slide numbering rendered on each slide (for example, 01 / 08), recalculated when slides are reordered or added
- Searchable visual asset library with emoji stickers plus 35+ illustrated Open Doodles character SVGs, symbols, signs, arrows, badges and business/lifestyle elements
- Fill, stroke, stroke width, opacity, soft shadow and visual style presets
- Object duplicate, delete and layer-order actions
- Per-slide canvas JSON state and local undo/redo history
- Motion-powered slide-switch preview transitions
- Responsive editor layout

## Tech stack

- Next.js 15, React 19 and TypeScript
- CSS design system
- Lucide icons
- npm workspaces

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

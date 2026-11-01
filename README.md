# SlideAI Studio

An AI-assisted presentation workspace built around conversational creation and a live slide editor.

> Early development scaffold. The current Studio uses local sample content; AI generation, persistence and export services are not connected yet.

## Current features

- Premium dark workspace dashboard
- Three-panel Studio layout: AI chat, slide canvas and design inspector
- Select slides from the filmstrip and add, duplicate, delete and reorder slides
- Fabric.js canvas with object selection, move, resize and rotate controls
- Freehand pencil drawing and drag-to-size shapes: rectangle, ellipse, triangle, line, arrow, star, diamond, pentagon, hexagon, heart and speech bubble
- Editable canvas text with 16 locally bundled Google Fonts families, variable font faces where available, and explicit font-load waiting before canvas redraw
- 25 text animation presets and 25 object animation presets, with selected-object preview
- 25 typography effects and 25 visual-item effects
- Import PNG, JPG, WEBP, GIF and SVG images from the computer (up to 12 MB per file)
- Searchable visual asset library with 230+ curated cartoon-style character stickers, symbols, signs, arrows, badges and business/lifestyle elements
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

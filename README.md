# SlideAI Studio

An AI-assisted presentation workspace built around conversational creation and a live slide editor.

> Early development scaffold. The current Studio uses local sample content; AI generation, persistence and export services are not connected yet.

## Current features

- Premium dark workspace dashboard
- Three-panel Studio layout: AI chat, slide canvas and design inspector
- Select slides from the filmstrip and add new slides
- Edit slide title, eyebrow and body text directly on the canvas or in the inspector
- Switch between violet, blue and light slide themes
- Adjust canvas zoom
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
packages/       # shared packages planned
docs/
  architecture.md
```

## Roadmap

1. Finish the Studio interaction model and design system.
2. Define a versioned DeckSpec schema and slide layout contracts.
3. Add FastAPI backend, database persistence and project history.
4. Integrate model-provider adapters and structured generation.
5. Add validated slide layouts, image/chart support and quality checks.
6. Implement and test PPTX/PDF export.

## Security

Do not commit API keys, tokens, passwords or production secrets. Keep local environment files out of Git.

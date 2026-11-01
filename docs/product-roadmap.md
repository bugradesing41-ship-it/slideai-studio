# SlideAI Studio — Product Roadmap

This roadmap prioritizes a dependable presentation workflow before adding advanced AI capabilities. Items are grouped by delivery stage; a listed item is planned, not necessarily implemented.

## Product direction

SlideAI Studio is an AI-native presentation workspace. A user should be able to describe an outcome, review a coherent slide plan, refine individual slides in natural language, and export a presentation that remains useful outside the product.

## Stage 1 — Reliable editing foundation

- [x] Versioned DeckSpec contract with Zod validation
- [x] Shared sample deck and typed slide model
- [x] Select and edit slides from the canvas and inspector
- [x] Add a new slide
- [x] Duplicate, delete and reorder slides
- [x] Local per-slide undo and redo history
- [ ] Autosave state and recover unsaved work
- [ ] Confirm destructive actions and improve empty/error states
- [x] Keyboard shortcuts for undo/redo, duplicate and delete
- [ ] Full accessibility audit and keyboard navigation for every control

## Stage 2 — Presentation creation workflow

- [ ] New-deck brief: topic, audience, purpose, language, length and tone
- [ ] AI-generated outline before slide rendering
- [ ] User approval and editable outline
- [ ] Structured slide generation that must pass DeckSpec validation
- [ ] Regenerate one slide without rewriting the whole deck
- [ ] Rewrite, shorten, expand, translate and change tone actions
- [ ] Background generation jobs with progress and retry states

## Stage 3 — Design and visual storytelling

- [x] Canvas object engine with freehand drawing, shape tools and transforms
- [x] Object styling controls, live Google Fonts catalogue with family-specific weights, Google Material Symbols and visual presets
- [x] Per-slide background colors and adjustable object corner radius
- [x] Rounded speech bubbles and character sticker insertion
- [x] 25 text and 25 object animation presets with immediate, non-destructive selected-object preview
- [x] Ten individually selectable, distinct slide entrance animations and Play all presentation preview
- [x] Real slide-number overlays synchronized with slide order and total count
- [x] 25 text effects and 25 item effects
- [x] Searchable visual asset library with Google Material Symbols, emoji stickers and 35+ Open Doodles character illustrations (CC0)
- [x] Motion-powered slide transition previews
- [ ] Layout catalog with validated layout-specific data contracts
- [ ] Design systems for editorial, technology, corporate, education, pitch and creative decks
- [ ] Automatic typography, spacing, contrast and overflow checks
- [x] Local image insertion for PNG, JPG, WEBP, GIF and SVG files
- [ ] Image search/provider adapter and image crop controls
- [ ] Editable charts, tables, comparisons and timelines
- [ ] Slide-level speaker notes and presenter view

## Stage 4 — Accounts and persistence

- [ ] Authentication and user workspaces
- [ ] PostgreSQL persistence for decks, slides and versions
- [ ] Autosave with conflict-safe updates
- [ ] Search, duplicate, rename, archive and delete presentations
- [ ] Version history and restore
- [ ] Secure file storage and upload validation

## Stage 5 — Export and sharing

- [ ] PPTX export with editable text and shapes
- [ ] PDF export with visual regression checks
- [ ] Read-only web presentation and share links
- [ ] Export queue, progress, retry and downloadable artifacts
- [ ] Import existing PPTX as a later compatibility milestone

## Stage 6 — Differentiating intelligence

- [ ] Source-grounded research with citations
- [ ] Spreadsheet/document-to-presentation workflows
- [ ] Audience and objective-aware storytelling suggestions
- [ ] Presentation quality review and factual consistency checks
- [ ] Translation and localization across languages
- [ ] Rehearsal coach, timing guidance and presenter feedback
- [ ] Team comments and collaborative editing

## Engineering principles

1. AI output is structured data, never arbitrary executable markup.
2. Validate every generated or edited deck against the shared schema.
3. Keep model providers behind an adapter so providers can be changed.
4. Treat export fidelity, accessibility, privacy and security as product requirements.
5. Do not mark a roadmap item complete until it is implemented and verified.

## AI Design MVP

- [x] Server-side OpenAI Responses API integration with strict JSON Schema output
- [x] Extend shared DeckSpec with design categories and editable canvas elements
- [x] Prompt-to-deck generation and refine-current-design modes
- [x] Convert generated elements into separate editable Fabric.js objects
- [x] Server-only API key configuration and request validation
- [ ] OpenAI image generation and replaceable image assets
- [ ] Authentication, durable quotas and project persistence
- [ ] PDF/PPTX export and presentation playback export

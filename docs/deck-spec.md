# DeckSpec

DeckSpec is the canonical, versioned data contract for every presentation in SlideAI Studio.

## Why it exists

The editor, AI planner, renderer, persistence layer and export adapters must operate on the same structured deck instead of maintaining separate slide representations.

## Version 1.0

A deck contains:
- Stable deck identity and schema version
- Title, description, language and visual theme
- An ordered collection of slides
- Metadata describing the source and timestamps

Each slide contains a stable numeric ID, title, eyebrow, body, semantic kind and a validated layout key. Optional speaker notes are supported.

## Validation

The shared package at `packages/shared` exports:
- `deckSpecSchema` and `slideSpecSchema` — Zod schemas
- `DeckSpec`, `SlideSpec` and `DeckTheme` — inferred TypeScript types
- `validateDeck(input)` — safe runtime validation

Validation rejects empty decks, duplicate slide IDs, invalid themes/layouts and out-of-range text. The editor validates slide edits before committing them to local state.

## Compatibility policy

- Increment `schemaVersion` for breaking data-shape changes.
- Prefer optional fields or explicit migrations for additive changes.
- Keep AI output constrained to known layout keys.
- Treat imported or model-generated JSON as untrusted until it passes validation.

## Current limitation

The editor uses the shared sample DeckSpec and validates local edits. Saving to a database, AI generation and export adapters are not connected yet.

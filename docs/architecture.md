# Architecture

## Product direction
SlideAI Studio is an AI-assisted presentation workspace combining conversational creation with a live slide editor.

## Initial architecture
- `apps/web`: Next.js, React and TypeScript user interface.
- `apps/api` (planned): Python/FastAPI application API.
- `packages/slide-engine` (planned): structured slide model, validation and rendering contracts.
- `packages/design-engine` (planned): themes, layout families and reusable slide layouts.
- PostgreSQL (planned): users, projects, decks, versions and jobs.
- Redis (planned): caching and background job coordination.

## Core principle
The model should produce and edit structured presentation data. A deterministic design/layout engine turns that data into slides, and the renderer displays the result. The model should not generate arbitrary UI markup as the presentation format.

## Development sequence
1. Establish the web workspace and design foundations.
2. Build the studio shell and interactive slide canvas.
3. Define and validate the DeckSpec data model.
4. Add model-provider adapters and generation workflows.
5. Add export pipelines and automated visual regression tests.

## Security
Never commit API keys, access tokens, private credentials or production secrets. Use environment variables and keep real environment files out of version control.

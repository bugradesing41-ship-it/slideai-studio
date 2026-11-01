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

## AI design generation

The Studio client sends prompts to `POST /api/ai/design`. The Node.js route calls the OpenAI Responses API using strict JSON Schema Structured Outputs. The generated response is parsed and validated against `@slideai/shared`'s DeckSpec Zod schema. Each slide can carry editable canvas elements (text, rectangles, ellipses, lines, triangles and image placeholders); the Fabric.js canvas instantiates those as separate objects. The OpenAI key is server-only via `OPENAI_API_KEY`.

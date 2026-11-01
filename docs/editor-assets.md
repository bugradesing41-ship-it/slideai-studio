# Editor assets and licensing

SlideAI Studio uses libraries that provide the editing primitives; the product UI, interaction model and document schema remain first-party code.

## Runtime libraries

| Package | Purpose | License / policy |
|---|---|---|
| Fabric.js | Canvas objects, freehand paths, selection, resize/rotate controls, serialization and filters | MIT; preserve upstream license notice |
| Motion for React | React transitions and motion-driven interface feedback | MIT |
| Lucide React | Toolbar and interface icon set | ISC; retain package attribution where required |
| Google Fonts CSS API | On-demand web font delivery and family metadata catalogue | Google Fonts terms and the individual family open-font license; requires internet access |
| Google Material Symbols | Editable icon glyphs from Google Fonts Icons | Apache 2.0; retain license notice |

## Dynamic Google typography

The Studio no longer bundles the previous 16 Fontsource families. It loads the Google Fonts metadata catalogue through a cached server route and requests the selected family and its supported weight variants from the Google Fonts CSS service. Font names and weights are selected from the live catalogue; unknown manually entered names fall back gracefully instead of throwing a font-face exception. The catalogue metadata endpoint is an undocumented Google Fonts site endpoint, so the route validates its response and degrades to a small offline picker list if the service changes. Font loading requires an internet connection.

## Editor capabilities

The current canvas implementation includes:

- Select, move, resize and rotate canvas objects
- Freehand pencil drawing
- Drag-to-size rectangle, ellipse, triangle, line and arrow tools
- Star, diamond, pentagon, hexagon, heart and speech-bubble shapes
- Editable text objects, live Google Fonts catalogue, family-specific weight variants and font-load synchronization before Fabric canvas redraw
- Font-weight selection based on each Google font family’s supported styles
- Image insertion from local PNG, JPG, WEBP, GIF and SVG files, with a 12 MB per-file limit
- Separate 25-preset text and 25-preset item animation collections. Each named preset has its own multi-step keyframe sequence; selecting a preset previews it immediately and restores the object afterward without saving an animation assignment
- Ten distinct per-slide entrance transitions, each with its own motion curve, and a Play all presentation preview
- Automatic slide number overlays in the format 01 / 08, synchronized with slide order and deck length
- Separate 25-preset typography and visual-item effect collections
- Per-slide background color, adjustable corner radius for selected objects, fill, stroke, stroke width, opacity and soft shadow controls
- Rounded speech-bubble drawing tool and direct access to character stickers
- Quick visual presets: Violet, Glass, Neon, Outline and Sunset
- Object duplicate/delete/front/back actions
- Per-slide canvas JSON state and local undo/redo history
- Motion-powered slide-switch preview transitions

## In-app visual asset library

The editor includes a searchable, category-filtered library with Google Material Symbols Outlined icons, 237+ Unicode visual assets and 35+ illustrated character SVGs from Open Doodles by Pablo Stanley. Character artwork is loaded from the Open Doodles public asset host and inserted as Fabric image objects that can be moved, resized, rotated, layered and deleted. Open Doodles states that its artwork is CC0 and free for commercial and personal use. Emoji appearance still depends on the operating system emoji font.

### Character illustration source

- Open Doodles by Pablo Stanley: https://www.opendoodles.com/
- License: CC0, including commercial and personal use, as stated by the publisher.
- The current character picker references individual SVGs hosted by Open Doodles. These illustrations are loaded at runtime, so the editor needs network access to that asset host. The project does not claim these remote SVGs are vendored into the repository.

## Asset intake rules

Before adding any third-party template, icon, illustration, animation or media pack:

1. Verify its repository and exact license, including asset-level licenses.
2. Prefer MIT, ISC, Apache-2.0, CC0 or clearly documented open font licenses.
3. Do not copy paid SDK assets or premium template libraries into the repository.
4. Keep attribution and license notices where the license requires them.
5. Store third-party assets separately from first-party components so they can be audited or replaced.

## Upstream references

- Fabric.js: https://github.com/fabricjs/fabric.js
- Motion: https://github.com/motiondivision/motion
- Lucide: https://github.com/lucide-icons/lucide
- Google Fonts: https://fonts.google.com/
- Google Material Symbols: https://fonts.google.com/icons
- Open Doodles: https://www.opendoodles.com/ (Pablo Stanley, CC0)
- Google Fonts licensing information: https://developers.google.com/fonts/faq

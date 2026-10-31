# Editor assets and licensing

SlideAI Studio uses libraries that provide the editing primitives; the product UI, interaction model and document schema remain first-party code.

## Runtime libraries

| Package | Purpose | License / policy |
|---|---|---|
| Fabric.js | Canvas objects, freehand paths, selection, resize/rotate controls, serialization and filters | MIT; preserve upstream license notice |
| Motion for React | React transitions and motion-driven interface feedback | MIT |
| Lucide React | Toolbar and interface icon set | ISC; retain package attribution where required |
| Fontsource families | Locally bundled web font files | Each family follows its upstream open font license; keep the included license files |

## Bundled typography

The editor bundles these font families locally through Fontsource packages:

- Inter
- DM Sans
- Manrope
- Space Grotesk
- Playfair Display
- Montserrat
- Lora

Bundling fonts locally avoids a runtime dependency on a third-party font stylesheet and makes font availability more predictable in production.

## Editor capabilities

The current canvas implementation includes:

- Select, move, resize and rotate canvas objects
- Freehand pencil drawing
- Drag-to-size rectangle, ellipse, triangle, line and arrow tools
- Star, diamond, pentagon, hexagon, heart and speech-bubble shapes
- Editable text objects and a curated font selector
- Fill, stroke, stroke width, opacity and soft shadow controls
- Quick visual presets: Violet, Glass, Neon, Outline and Sunset
- Object duplicate/delete/front/back actions
- Per-slide canvas JSON state and local undo/redo history
- Motion-powered slide-switch preview transitions

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
- Fontsource: https://github.com/fontsource/fontsource
- Google Fonts licensing information: https://developers.google.com/fonts/faq

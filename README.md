# SlideAI Studio

A browser-based presentation editor focused on hands-on slide design, typography, assets, animation and export.

## Current editor features

- Three-panel visual editor with a Fabric.js canvas
- Add, duplicate, delete and reorder slides
- Editable text, drawing tools, vector shapes, image import and object layering
- Google Fonts catalogue with a searchable, scrollable font-family picker and weight controls
- Theme, background, fill, stroke, opacity, shadow and corner-radius controls
- Slide transition previews
- Built-in animation presets for selected text objects and visual elements, with separate curated sets
- Per-object animation settings are saved in the editable project and replay during slide presentation preview
- Dedicated animation preview for the currently selected object
- Automatic browser-local saving for the current project
- Export the editable SlideAI project as `.slideai.json`
- Export the current slide as PNG
- Export a basic Microsoft PowerPoint `.pptx` deck
- Share the project file through the browser's native share sheet when supported
- Top-right Export menu for project JSON, current-slide PNG and PowerPoint

## Important export notes

- The editable project export retains slide data, Fabric canvas JSON and each object's selected animation preset.
- PNG export captures the current slide canvas as a still image; object animations are intended for presentation playback.
- PowerPoint export currently maps slide eyebrow, title and body text into editable PowerPoint text boxes. It does not yet reproduce every Fabric object, imported animation, transition or custom font exactly.
- The Share action shares the project file when the browser supports file sharing. Otherwise it falls back to sharing/copying project information; it does not create a permanent hosted URL.
- OneDrive sign-in, Microsoft Graph cloud save and collaborative editing are not connected yet. PowerPoint file export is the current Microsoft 365 compatibility path.

## Tech stack

- Next.js 15, React 19 and TypeScript
- Fabric.js canvas
- Motion for slide transition previews
- PptxGenJS for PowerPoint generation
- Google Fonts metadata catalogue
- Zod DeckSpec validation

## Run locally

Requirements: Node.js 20.9+ and npm 10+.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the workspace and [http://localhost:3000/studio](http://localhost:3000/studio) for the editor.

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
packages/
  shared/
```

## Licensing

The dotLottie React player is MIT-licensed. Animation files sourced from community libraries have their own licenses and attribution requirements; check each asset before commercial use. The editor links to community libraries rather than mirroring their entire asset catalog.

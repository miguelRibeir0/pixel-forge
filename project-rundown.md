# ***Pixel Forge — Final Project Rundown**

***A solo-built, browser-based 16-bit pixel art studio for TypeScript web game development, with AI-assisted generation.**


## ***1. Product Vision**

***Pixel Forge is a personal web-based pixel art creator designed around a solo TypeScript game dev workflow. It produces production-ready sprites, animations, tilesets, and backgrounds with type-safe exports and an integrated AI assistant for rapid asset generation.**

***Core principles:**

- ***Pixel-perfect, no compromises**

- ***Every AI output is fully editable**

- ***Exports drop straight into Phaser / PixiJS / Kaboom / Excalibur projects**

- ***Runs entirely in the browser, local-first storage**


## ***2. Tech Stack**

| **Layer** | **Choice** |
| :-: | :-: |
| Build tool | Vite |
| Framework | React + TypeScript |
| Canvas | HTML5 Canvas 2D API |
| State | Zustand |
| Styling | Tailwind CSS |
| Storage | IndexedDB (via **`idb`**) |
| Export libs | **`jszip`**, **`gif.js`**, **`upng-js`** |
| LLM (chat/prompt refinement) | OpenRouter (cheap model, e.g. Llama 3.1 8B) |
| Image generation | Fal.ai or Replicate (SDXL + pixel LoRA) |
| Hosting | Vercel or Cloudflare Pages |
| API key handling | **`.env.local`** for dev → serverless proxy when deployed |


## ***3. Feature Set**

### ***A. Editor Core**

- ***Pencil, eraser, bucket fill, line, rectangle, ellipse, selection, move, eyedropper**

- ***Dithering brush + pattern fill**

- ***Layers: add/reorder/merge/opacity/blend modes/visibility**

- ***Undo/redo via command pattern (diff-based, memory efficient)**

- ***Grid, pixel snapping, symmetry tools (H/V/radial)**

- ***Zoom: 100% → 3200%, pixel-perfect at all levels**

### ***B. Color & Palette**

- ***Indexed color mode (authentic retro workflow)**

- ***Built-in palettes: PICO-8, AAP-64, NES, SNES, GameBoy**

- ***Custom palette creation + import (`.pal`, `.hex`, `.gpl`)**

- ***Palette swap / remap tool**

### ***C. Canvas & Project**

- ***Preset sizes: 16, 32, 64, 128, 256 + custom**

- ***Multiple documents per project**

- ***Project file format: `.pforge` (zipped JSON + PNGs)**

- ***Autosave to IndexedDB**

### ***D. Animation**

- ***Frame-based timeline**

- ***Per-frame duration**

- ***Onion skinning (prev/next frames, configurable)**

- ***Looping playback preview**

- ***Animation tags (idle, run, attack, etc.)**

### ***E. Asset Types**

- ***Sprites — characters, objects**

- ***Tilesets — configurable tile size (8/16/32px)**

- ***Backgrounds — with optional parallax layer support**

### ***F. Export Pipeline (TypeScript-first)**

- ***PNG sprite sheet + JSON atlas (Phaser/PixiJS format)**

- ***Aseprite-compatible JSON (works with Kaboom, Excalibur, etc.)**

- ***Auto-generated TypeScript definition file with typed frame/animation constants:**

- ***ts**

- ```
***`export const PlayerFrames = \{`**

- `  ***idle: \[0, 1, 2, 3\],`**

- `  ***run: \[4, 5, 6, 7, 8, 9\],`**

- ***`\} as const;`**
```

- ***GIF / APNG for previews**

- ***Raw PNG frames in a zip**

- ***Tileset export with grid metadata JSON**

### ***G. AI Generation**

- ***Chat panel docked in editor**

- ***Session-scoped context: remembers palette, canvas size, style tags**

- ***Two-stage pipeline:**

  1. ***OpenRouter LLM refines the user prompt with session context**

  2. ***Fal.ai / Replicate generates the pixel art image**

- ***Client-side post-processing: downscale + palette quantization + AA removal**

- ***Output inserted as a new editable layer**

- ***Refinement via follow-ups: "face left", "add a hat", "darker cape"**


## ***4. AI Pipeline**

***text**

```
***`User prompt in chat`**

`   ↓`

***`Session context (palette, canvas size, style, prior messages)`**

`   ↓`

***`OpenRouter LLM (cheap model) → optimized image prompt`**

`   ↓`

***`Fal.ai / Replicate (pixel art model) → raw image`**

`   ↓`

***`Client-side processor:`**

`  ***- Downscale to target resolution`**

`  ***- Quantize to session palette`**

`  ***- Strip anti-aliasing`**

`  ***- Optional background removal`**

`   ↓`

***`Inserted as new editable layer`**
```

***Cost profile: LLM calls are negligible (\<$0.001 each); image calls ~$0.01–0.05. Budget-friendly for personal use.**


## ***5. Architecture**

***text**

```
`┌─────────────────────────────────────┐`

`│      ***React UI (Tailwind)            │`**

`│  ***Toolbars · Panels · Timeline · AI  │`**

`├─────────────────────────────────────┤`

`│     ***Editor Core (Canvas 2D)         │`**

`│  ***Layers · Tools · History · Palette │`**

`├─────────────────────────────────────┤`

`│     ***Project Model (Zustand)         │`**

`├─────────────────────────────────────┤`

`│  ***IndexedDB │ Export │ AI Client     │`**

`└──────┬──────────┬──────────┬────────┘`

`       │          │          │`

`   ***Local DB   File API   OpenRouter + Fal.ai`**

`                         ***(via .env.local or proxy)`**
```


## ***6. Project Structure**

***text**

```
***`pixel-forge/`**

`├── ***src/`**

`│   ├── ***editor/`**

`│   │   ├── ***canvas/         \# Rendering engine`**

`│   │   ├── ***tools/          \# Pencil, bucket, etc.`**

`│   │   ├── ***layers/         \# Layer system`**

`│   │   ├── ***history/        \# Undo/redo (command pattern)`**

`│   │   └── ***palette/        \# Color management`**

`│   ├── ***animation/`**

`│   │   ├── ***timeline.ts`**

`│   │   └── ***onion-skin.ts`**

`│   ├── ***ai/`**

`│   │   ├── ***openrouter.ts   \# Prompt refinement`**

`│   │   ├── ***image-gen.ts    \# Fal.ai / Replicate`**

`│   │   ├── ***quantize.ts     \# Palette snapping`**

`│   │   └── ***session.ts      \# Chat session state`**

`│   ├── ***export/`**

`│   │   ├── ***png.ts`**

`│   │   ├── ***atlas.ts`**

`│   │   ├── ***gif.ts`**

`│   │   └── ***typescript.ts   \# TS definition generator`**

`│   ├── ***storage/`**

`│   │   └── ***indexeddb.ts`**

`│   ├── ***store/              \# Zustand stores`**

`│   ├── ***ui/`**

`│   │   ├── ***panels/`**

`│   │   ├── ***toolbar/`**

`│   │   ├── ***timeline/`**

`│   │   └── ***ai-chat/`**

`│   └── ***main.tsx`**

`├── ***.env.local              \# API keys (gitignored)`**

`└── ***vite.config.ts`**
```


## ***7. Data Model (Foundation)**

***The types to nail down first — everything else builds on these:**

***ts**

```
***`type Project = \{`**

`  ***id: string;`**

`  ***name: string;`**

`  ***palette: Palette;`**

`  ***documents: Document\[\]; *// sprites, tilesets, backgrounds`***

`  ***createdAt: number;`**

`  ***updatedAt: number;`**

***`\};`**


***`type Document = \{`**

`  ***id: string;`**

`  ***type: "sprite" | "tileset" | "background";`**

`  ***width: number;`**

`  ***height: number;`**

`  ***frames: Frame\[\];`**

`  ***tags: AnimationTag\[\];`**

***`\};`**


***`type Frame = \{`**

`  ***id: string;`**

`  ***duration: number; *// ms`***

`  ***layers: Layer\[\];`**

***`\};`**


***`type Layer = \{`**

`  ***id: string;`**

`  ***name: string;`**

`  ***visible: boolean;`**

`  ***opacity: number;`**

`  ***blendMode: BlendMode;`**

`  ***pixels: Uint8Array; *// indexed into palette`***

***`\};`**


***`type Palette = \{`**

`  ***id: string;`**

`  ***name: string;`**

`  ***colors: string\[\]; *// hex`***

***`\};`**


***`type AnimationTag = \{`**

`  ***name: string;`**

`  ***from: number;`**

`  ***to: number;`**

`  ***loop: boolean;`**

***`\};`**
```


## ***8. Roadmap (Solo Pace, ~6–8 weeks)**

### ***Phase 1 — Core Editor (2–3 weeks)**

***Canvas, pencil/eraser/bucket/eyedropper, layers, undo/redo, palette (PICO-8 default), PNG export, IndexedDB autosave.**

### ***Phase 2 — Animation + Sheets (1–2 weeks)**

***Frame timeline, onion skin, sprite sheet packer, GIF export, TypeScript definition generator.**

### ***Phase 3 — AI Integration (2 weeks)**

***OpenRouter chat client, Fal.ai image gen, palette quantizer, insert-as-layer, refinement flow.**

### ***Phase 4 — Tilesets (1 week)**

***Tile grid mode, tileset export with JSON metadata.**

### ***Phase 5 — Polish (ongoing)**

***Shortcuts, more tools (selection, dithering), engine-specific presets, UX refinement.**


## ***9. Technical Challenges to Plan For**

1. ***Pixel-perfect rendering at any zoom — disable image smoothing, integer transforms only**

2. ***Memory-efficient undo — diff-based commands, not full snapshots**

3. ***AI palette fidelity — tune quantization (k-means vs. nearest-neighbor)**

4. ***Export correctness — test atlas outputs in Phaser/PixiJS early**

5. ***API key security — proxy before any public deploy**


## ***10. Confirmed Decisions**

- ✅ ***Solo, web-only, personal use**

- ✅ ***OpenRouter for LLM; Fal.ai/Replicate for image gen**

- ✅ ***TypeScript web games are primary export target**

- ✅ ***TypeScript definition export is a first-class feature**

- ✅ ***PICO-8 as default starter palette**

- ✅ ***Local-first (IndexedDB), no backend until deploy**


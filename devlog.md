# Pixel Forge — Development Log

## Day 1 — Project Kickoff

**Goals:** Scaffold the project, define types, build the core editor canvas with basic tools.

### Milestones
- [x] Project scaffolded with Vite + React + TypeScript + Tailwind v4
- [x] Data model types defined (Project, Document, Frame, Layer, Palette, AnimationTag, etc.)
- [x] Zustand store set up (editor state, layer/frame management, undo/redo)
- [x] Canvas rendering engine with pixel-perfect zoom, checkerboard bg, grid overlay
- [x] Core tools: pencil, eraser, bucket fill, eyedropper (with Bresenham line interpolation)
- [x] Layer system (add, remove, visibility, opacity, blend modes)
- [x] Undo/redo with command pattern (diff-based)
- [x] PICO-8 palette integrated (plus AAP-64, NES)
- [x] Editor UI layout (toolbar, canvas, color palette, layer panel, timeline)
- [x] Welcome screen with project creation
- [x] Frame timeline (add, remove, duplicate frames)

### Architecture
- **Types:** `src/types/index.ts` — all data model types
- **Store:** `src/store/editorStore.ts` — single Zustand store for all editor state
- **Canvas:** `src/editor/canvas/renderer.ts` — CanvasRenderer class (pixel-perfect, zoom, grid, checkerboard)
- **Tools:** `src/editor/tools/index.ts` — Pencil, Eraser, Bucket, Eyedropper tool handlers
- **Palette:** `src/editor/palette/palettes.ts` — PICO-8, AAP-64, NES palettes
- **UI:** `src/ui/` — Toolbar, ColorPalette, LayerPanel, Timeline, PixelCanvas, App

### Tech decisions
- Tailwind CSS v4 with `@tailwindcss/vite` plugin and custom theme (dark UI)
- Zustand for state (single store pattern with selectors)
- Canvas 2D API with `imageSmoothingEnabled = false` for pixel-perfect rendering
- Bresenham line interpolation for smooth drawing between mouse events
- Flood fill (stack-based) for bucket tool
- Right-click / Ctrl+click for secondary color selection

### Notes
- All rendering must be pixel-perfect — disable image smoothing, integer transforms only
- Undo/redo must be diff-based, not full snapshots, for memory efficiency
- Build compiles clean — TypeScript and Vite build succeed

### Next steps
- [ ] IndexedDB autosave (using `idb` lib)
- [ ] PNG export
- [ ] Animation playback preview
- [ ] Onion skinning
- [ ] More tools (line, rectangle, ellipse, selection, move, dither)
- [ ] Keyboard shortcuts
- [ ] AI integration (Phase 3)
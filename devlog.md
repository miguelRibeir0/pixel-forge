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
- [ ] PNG export
- [ ] Animation playback preview
- [ ] Onion skinning
- [ ] AI integration (Phase 3)

## Day 2 — Tools, Shortcuts, Autosave

**Goals:** Fit-to-container canvas, fix undo/redo, implement all tools, keyboard shortcuts, IndexedDB autosave.

### Milestones
- [x] Canvas fit-to-container mode (auto-zooms to fill available space, centers document)
- [x] Fit toggle button in canvas corner, zoom indicator shows fractional zoom in fit mode
- [x] Fixed undo/redo — now actually applies pixel diffs (was broken, just moved commands between stacks)
- [x] New tools: Line, Rectangle, Ellipse, Selection, Move, Dither
- [x] Shape tools (Line, Rect, Ellipse) have live preview overlay during drag
- [x] Selection tool with visual dashed border
- [x] Move tool — moves layer contents with snapshot/restore
- [x] Dither tool — checkerboard pattern brush
- [x] All tools push undo commands on completion
- [x] Preview pixel system for shape tools (semi-transparent overlay)
- [x] Keyboard shortcuts: B/E/G/I/L/R/M/V/D for tools, Ctrl+Z/Ctrl+Shift+Z undo/redo, +/- zoom, X swap colors, [/] brush size, H grid, Esc clear selection
- [x] Shortcut hints in toolbar tooltips
- [x] IndexedDB autosave via `idb` library (debounced 1s, loads last project on start)
- [x] Loading screen while checking for saved projects
- [x] `SelectionRect` and `SelectionState` types added

### Architecture changes
- **Types:** Added `SelectionRect`, `SelectionState` to `src/types/index.ts`
- **Store:** Added `fitMode`, `previewPixels`, `selection` state; `setFitMode`, `setPreviewPixels`, `setSelection` actions
- **Renderer:** Fit-to-container zoom calculation, preview pixel overlay, selection rectangle rendering
- **Tools:** Complete rewrite — 10 tools all with undo support, preview system for shapes
- **Storage:** New `src/storage/indexeddb.ts` — save/load/list/delete projects
- **Shortcuts:** New `src/editor/shortcuts.ts` — keyboard shortcut hook

### Notes
- Fit mode calculates zoom as `min(availW/docW, availH/docH)` with 40px padding
- Manual zoom (scroll wheel) automatically disables fit mode
- Preview pixels rendered at 60% opacity as overlay
- Move tool uses snapshot approach — copies entire layer on mouseDown, restores on mouseUp
- Autosave triggers on any project state change, debounced to 1s

## Day 3 — Project Management, Overlays, Persistence Fixes

**Goals:** Project selector UI, cursor overlays, selection-aware tools, persistence fixes.

### Milestones
- [x] Project selector UI with Recent/New tabs
- [x] Recent projects list with load/delete, sorted by last updated
- [x] New project tab with name + size presets
- [x] Click project name in editor header to go back to selector
- [x] Cursor overlay system — brush preview on canvas
- [x] Overlay has minimum 6px visual size (visible at any zoom)
- [x] Red border on brush overlay (1px width)
- [x] Cursor hidden over document area, visible outside
- [x] Grabbing cursor when panning
- [x] Space + drag to pan canvas (alongside middle-click and Alt+click)
- [x] Alt + scroll wheel to change brush size
- [x] Selection-aware bucket fill — flood fill constrained to selection bounds
- [x] Selection-aware move tool — only moves pixels within selection
- [x] Move tool disabled when no selection exists
- [x] Move tool updates selection position after moving
- [x] Canvas state persistence — showGrid, zoom, pan, fitMode saved with project
- [x] Fixed major persistence bug — `setProject` now restores activeDocumentId/activeFrameId/activeLayerId
- [x] Save system overhaul — immediate saves, no debounce
- [x] `pagehide` and `visibilitychange` handlers for reliable save on refresh/close
- [x] `saveProjectSync` for beforeunload scenarios
- [x] JSON dedup check to avoid redundant IndexedDB writes
- [x] New projects saved immediately on creation
- [x] Grid default changed to off
- [x] Updated shortcuts: S=selection, M=move (was M=selection, V=move)

### Architecture changes
- **Types:** Added `canvasState?: CanvasState` to Project type
- **Store:** Added `cursorPixel` state, `setCursorPixel`, `clearProject` actions; `setProject` now restores full editor state
- **Renderer:** Cursor overlay with minimum size, red border, crosshair for non-draw tools
- **Storage:** Rewrote save system — `saveProject` with JSON dedup, `saveProjectSync` for sync contexts, removed debounce
- **UI:** New `ProjectSelector` component, dynamic cursor toggling in PixelCanvas
- **Tools:** BucketTool accepts optional selection bounds, MoveTool requires selection

### Bug fixes
- Undo/redo was only moving commands between stacks, not applying diffs (fixed Day 2, verified)
- Canvas fit mode caused infinite re-render loop — added value change guard
- Grid disappeared on refresh — canvas state not persisted, active IDs not restored
- Drawings disappeared on refresh — `setProject` didn't restore active document/frame/layer
- Async IndexedDB save didn't complete before page unload — switched to immediate saves + pagehide handler
- Cursor overlay invisible at low zoom — added minimum visual size
- Browser cursor hidden everywhere — now only hidden over document area

## Day 4 — Undo Bug Fix & PNG Export

**Goals:** Fix the `oldIndex` bug breaking undo, implement PNG export.

### Milestones
- [x] Fixed critical `oldIndex` bug — undo was restoring all pixels to transparent (index 0) instead of their actual previous color
- [x] Added `getPixelValue()` helper to read actual pixel values from the active layer
- [x] Added `finalizeDiffs()` helper to deduplicate diffs and preserve original colors for undo
- [x] Rewrote `PencilTool`, `EraserTool`, `DitherTool` to use per-pixel old value caching
- [x] Fixed `LineTool`, `RectangleTool`, `EllipseTool` to read actual oldIndex via `getPixelValue()`
- [x] Fixed `MoveTool` preview diffs to capture correct old values at destination pixels
- [x] Implemented PNG export — composites all visible layers with proper alpha blending
- [x] Fixed export quality issues with nearest-neighbor upscaling (8x for <=32px, 4x for <=64px, 2x for <=128px)
- [x] Added "EXPORT PNG" button in editor header
- [x] Build compiles clean — TypeScript and Vite production build succeed

### Architecture changes
- **Tools:** `src/editor/tools/index.ts` — `getPixelValue()`, `finalizeDiffs()` helpers; all tools now capture correct `oldIndex`
- **Export:** New `src/export/png.ts` — `exportFrameAsPng()` with nearest-neighbor upscaling
- **UI:** Updated `src/App.tsx` — `EditorHeader` now includes EXPORT PNG button

### Bug fixes
- `oldIndex` was hardcoded to `0` across all tools, making undo always restore to transparent regardless of what was actually there before
- `commitDiffs()` now reads actual old pixel values before pushing the command
- Export was blurry because small canvases (32x32, 64x64) opened in image viewers with bilinear interpolation — fixed by upscaling the PNG

### Next steps
- [ ] Animation playback preview
- [ ] Onion skinning
- [ ] AI integration (Phase 3)
- [ ] Layer reordering UI (drag-and-drop)
- [ ] Layer renaming UI
- [ ] Symmetry tools (H/V/radial)

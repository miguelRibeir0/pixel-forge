import useEditorStore from '../../store/editorStore';
import type { PixelDiff } from '../../types';
import { nanoid } from 'nanoid';

export interface ToolHandler {
  onMouseDown(x: number, y: number, button: number): void;
  onMouseMove(x: number, y: number): void;
  onMouseUp(): void;
}

function getDocDimensions(): { width: number; height: number } {
  const state = useEditorStore.getState();
  const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
  return { width: doc?.width ?? 32, height: doc?.height ?? 32 };
}

function getActiveLayerPixels(): { pixels: Uint8Array; width: number; height: number } | null {
  const state = useEditorStore.getState();
  const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
  if (!doc) return null;
  const frame = doc.frames.find(f => f.id === state.activeFrameId);
  if (!frame) return null;
  const layer = frame.layers.find(l => l.id === state.activeLayerId);
  if (!layer) return null;
  return { pixels: layer.pixels, width: doc.width, height: doc.height };
}

function getBrushPixels(x: number, y: number, size: number, docWidth: number, docHeight: number): { x: number; y: number }[] {
  const pixels: { x: number; y: number }[] = [];
  const half = Math.floor(size / 2);
  for (let dy = -half; dy < size - half; dy++) {
    for (let dx = -half; dx < size - half; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= 0 && py >= 0 && px < docWidth && py < docHeight) {
        pixels.push({ x: px, y: py });
      }
    }
  }
  return pixels;
}

function bresenhamLine(x0: number, y0: number, x1: number, y1: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let cx = x0, cy = y0;
  while (true) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
  return points;
}

function floodFill(startX: number, startY: number, newColorIndex: number, pixels: Uint8Array, docWidth: number, docHeight: number, selection?: { x: number; y: number; width: number; height: number } | null): PixelDiff[] {
  const targetIndex = pixels[startY * docWidth + startX];
  if (targetIndex === newColorIndex) return [];
  const diffs: PixelDiff[] = [];
  const visited = new Set<number>();
  const stack = [{ x: startX, y: startY }];
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const idx = y * docWidth + x;
    if (x < 0 || x >= docWidth || y < 0 || y >= docHeight) continue;
    if (visited.has(idx)) continue;
    if (pixels[idx] !== targetIndex) continue;
    if (selection) {
      if (x < selection.x || x >= selection.x + selection.width || y < selection.y || y >= selection.y + selection.height) continue;
    }
    visited.add(idx);
    diffs.push({ x, y, oldIndex: pixels[idx], newIndex: newColorIndex });
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
  return diffs;
}

function getRectPixels(x0: number, y0: number, x1: number, y1: number, filled: boolean, docW: number, docH: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const minX = Math.max(0, Math.min(x0, x1));
  const maxX = Math.min(docW - 1, Math.max(x0, x1));
  const minY = Math.max(0, Math.min(y0, y1));
  const maxY = Math.min(docH - 1, Math.max(y0, y1));

  if (filled) {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        points.push({ x, y });
      }
    }
  } else {
    for (let x = minX; x <= maxX; x++) {
      points.push({ x, y: minY });
      points.push({ x, y: maxY });
    }
    for (let y = minY + 1; y < maxY; y++) {
      points.push({ x: minX, y });
      points.push({ x: maxX, y });
    }
  }
  return points;
}

function getEllipsePixels(x0: number, y0: number, x1: number, y1: number, filled: boolean, docW: number, docH: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const cx = Math.round((x0 + x1) / 2);
  const cy = Math.round((y0 + y1) / 2);
  const rx = Math.abs(x1 - x0) / 2;
  const ry = Math.abs(y1 - y0) / 2;

  if (rx < 0.5 && ry < 0.5) {
    if (cx >= 0 && cy >= 0 && cx < docW && cy < docH) points.push({ x: cx, y: cy });
    return points;
  }

  if (filled) {
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(docH - 1, Math.ceil(cy + ry)); y++) {
      for (let x = Math.max(0, Math.floor(cx - rx)); x <= Math.min(docW - 1, Math.ceil(cx + rx)); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1.0) {
          points.push({ x, y });
        }
      }
    }
  } else {
    const set = new Set<string>();
    const steps = Math.max(rx, ry) * 8 + 16;
    for (let i = 0; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps;
      const px = Math.round(cx + rx * Math.cos(angle));
      const py = Math.round(cy + ry * Math.sin(angle));
      if (px >= 0 && py >= 0 && px < docW && py < docH) {
        const key = `${px},${py}`;
        if (!set.has(key)) {
          set.add(key);
          points.push({ x: px, y: py });
        }
      }
    }
  }
  return points;
}

function applyDiffsAsPreview(diffs: PixelDiff[]) {
  useEditorStore.getState().setPreviewPixels(diffs);
}

function commitDiffs(diffs: PixelDiff[], description: string) {
  const state = useEditorStore.getState();
  if (diffs.length === 0) return;
  state.setPixels(diffs);
  state.pushCommand({
    id: nanoid(),
    description,
    diffs,
    layerId: state.activeLayerId!,
    frameId: state.activeFrameId!,
  });
}

export class PencilTool implements ToolHandler {
  drawing = false;
  allDiffs: PixelDiff[] = [];

  onMouseDown(x: number, y: number, button: number) {
    const state = useEditorStore.getState();
    const colorIndex = button === 2 ? state.secondaryColorIndex : state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const pixels = getBrushPixels(x, y, state.brushSize, width, height);
    const diffs: PixelDiff[] = pixels.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: colorIndex }));
    this.allDiffs = diffs;
    state.setPixels(diffs);
    state.setDrawing(true);
    state.setLastPixel({ x, y });
    this.drawing = true;
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const lastPixel = state.lastPixel;
    if (!lastPixel) return;
    const colorIndex = state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const points = bresenhamLine(lastPixel.x, lastPixel.y, x, y);
    const newDiffs: PixelDiff[] = [];
    for (const p of points) {
      const pixels = getBrushPixels(p.x, p.y, state.brushSize, width, height);
      for (const px of pixels) {
        newDiffs.push({ x: px.x, y: px.y, oldIndex: 0, newIndex: colorIndex });
      }
    }
    this.allDiffs.push(...newDiffs);
    state.setPixels(newDiffs);
    state.setLastPixel({ x, y });
  }

  onMouseUp() {
    if (this.drawing && this.allDiffs.length > 0) {
      commitDiffs(this.allDiffs, 'Pencil stroke');
    }
    this.drawing = false;
    this.allDiffs = [];
    useEditorStore.getState().setDrawing(false);
    useEditorStore.getState().setLastPixel(null);
  }
}

export class EraserTool implements ToolHandler {
  drawing = false;
  allDiffs: PixelDiff[] = [];

  onMouseDown(x: number, y: number) {
    const state = useEditorStore.getState();
    const { width, height } = getDocDimensions();
    const pixels = getBrushPixels(x, y, state.brushSize, width, height);
    const diffs: PixelDiff[] = pixels.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: 0 }));
    this.allDiffs = diffs;
    state.setPixels(diffs);
    state.setDrawing(true);
    state.setLastPixel({ x, y });
    this.drawing = true;
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const lastPixel = state.lastPixel;
    if (!lastPixel) return;
    const { width, height } = getDocDimensions();
    const points = bresenhamLine(lastPixel.x, lastPixel.y, x, y);
    const newDiffs: PixelDiff[] = [];
    for (const p of points) {
      const pixels = getBrushPixels(p.x, p.y, state.brushSize, width, height);
      for (const px of pixels) {
        newDiffs.push({ x: px.x, y: px.y, oldIndex: 0, newIndex: 0 });
      }
    }
    this.allDiffs.push(...newDiffs);
    state.setPixels(newDiffs);
    state.setLastPixel({ x, y });
  }

  onMouseUp() {
    if (this.drawing && this.allDiffs.length > 0) {
      commitDiffs(this.allDiffs, 'Erase');
    }
    this.drawing = false;
    this.allDiffs = [];
    useEditorStore.getState().setDrawing(false);
    useEditorStore.getState().setLastPixel(null);
  }
}

export class BucketTool implements ToolHandler {
  onMouseDown(x: number, y: number, button: number) {
    const state = useEditorStore.getState();
    const colorIndex = button === 2 ? state.secondaryColorIndex : state.activeColorIndex;
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    const frame = doc?.frames.find(f => f.id === state.activeFrameId);
    const layer = frame?.layers.find(l => l.id === state.activeLayerId);
    if (!doc || !frame || !layer || layer.locked) return;
    const diffs = floodFill(x, y, colorIndex, layer.pixels, doc.width, doc.height, state.selection);
    if (diffs.length > 0) {
      state.setPixels(diffs);
      state.pushCommand({
        id: nanoid(),
        description: 'Bucket fill',
        diffs,
        layerId: state.activeLayerId!,
        frameId: state.activeFrameId!,
      });
    }
  }

  onMouseMove() {}
  onMouseUp() {}
}

export class EyedropperTool implements ToolHandler {
  onMouseDown(x: number, y: number) {
    const state = useEditorStore.getState();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    const frame = doc?.frames.find(f => f.id === state.activeFrameId);
    if (!doc || !frame) return;
    const colorIdx = frame.layers
      .filter(l => l.visible)
      .reduceRight((acc: number, layer) => {
        if (acc !== 0) return acc;
        return layer.pixels[y * doc.width + x];
      }, 0);
    if (colorIdx !== 0) {
      state.setActiveColorIndex(colorIdx);
    }
  }

  onMouseMove() {}
  onMouseUp() {}
}

export class LineTool implements ToolHandler {
  startX = 0;
  startY = 0;
  drawing = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseDown(x: number, y: number, _button: number) {
    this.startX = x;
    this.startY = y;
    this.drawing = true;
    useEditorStore.getState().setDrawing(true);
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const colorIndex = state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const points = bresenhamLine(this.startX, this.startY, x, y);
    const diffs: PixelDiff[] = [];
    for (const p of points) {
      const brushPixels = getBrushPixels(p.x, p.y, state.brushSize, width, height);
      for (const bp of brushPixels) {
        diffs.push({ x: bp.x, y: bp.y, oldIndex: 0, newIndex: colorIndex });
      }
    }
    applyDiffsAsPreview(diffs);
  }

  onMouseUp() {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const preview = state.previewPixels;
    if (preview && preview.length > 0) {
      state.setPreviewPixels(null);
      commitDiffs(preview, 'Line');
    }
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
  }
}

export class RectangleTool implements ToolHandler {
  startX = 0;
  startY = 0;
  drawing = false;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onMouseDown(x: number, y: number, _button: number) {
    this.startX = x;
    this.startY = y;
    this.drawing = true;
    useEditorStore.getState().setDrawing(true);
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const colorIndex = state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const points = getRectPixels(this.startX, this.startY, x, y, false, width, height);
    const diffs: PixelDiff[] = points.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: colorIndex }));
    applyDiffsAsPreview(diffs);
  }

  onMouseUp() {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const preview = state.previewPixels;
    if (preview && preview.length > 0) {
      state.setPreviewPixels(null);
      commitDiffs(preview, 'Rectangle');
    }
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
  }
}

export class EllipseTool implements ToolHandler {
  startX = 0;
  startY = 0;
  drawing = false;

  onMouseDown(x: number, y: number) {
    this.startX = x;
    this.startY = y;
    this.drawing = true;
    useEditorStore.getState().setDrawing(true);
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const colorIndex = state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const points = getEllipsePixels(this.startX, this.startY, x, y, false, width, height);
    const diffs: PixelDiff[] = points.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: colorIndex }));
    applyDiffsAsPreview(diffs);
  }

  onMouseUp() {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const preview = state.previewPixels;
    if (preview && preview.length > 0) {
      state.setPreviewPixels(null);
      commitDiffs(preview, 'Ellipse');
    }
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
  }
}

export class SelectionTool implements ToolHandler {
  startX = 0;
  startY = 0;
  drawing = false;

  onMouseDown(x: number, y: number) {
    this.startX = x;
    this.startY = y;
    this.drawing = true;
    useEditorStore.getState().setDrawing(true);
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const minX = Math.min(this.startX, x);
    const minY = Math.min(this.startY, y);
    const maxX = Math.max(this.startX, x);
    const maxY = Math.max(this.startY, y);
    useEditorStore.getState().setSelection({
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    });
  }

  onMouseUp() {
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
  }
}

export class MoveTool implements ToolHandler {
  startX = 0;
  startY = 0;
  drawing = false;
  snapshot: Uint8Array | null = null;
  snapshotW = 0;
  snapshotH = 0;
  sel: { x: number; y: number; width: number; height: number } | null = null;

  onMouseDown(x: number, y: number) {
    const state = useEditorStore.getState();
    const selection = state.selection;
    if (!selection) return;
    const info = getActiveLayerPixels();
    if (!info) return;
    this.startX = x;
    this.startY = y;
    this.drawing = true;
    this.sel = selection;
    this.snapshot = new Uint8Array(info.pixels);
    this.snapshotW = info.width;
    this.snapshotH = info.height;
    state.setDrawing(true);
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing || !this.snapshot || !this.sel) return;
    const dx = x - this.startX;
    const dy = y - this.startY;
    const state = useEditorStore.getState();
    const diffs: PixelDiff[] = [];

    for (let sy = this.sel.y; sy < this.sel.y + this.sel.height; sy++) {
      for (let sx = this.sel.x; sx < this.sel.x + this.sel.width; sx++) {
        if (sx < 0 || sx >= this.snapshotW || sy < 0 || sy >= this.snapshotH) continue;
        const srcIdx = sy * this.snapshotW + sx;
        const colorIdx = this.snapshot[srcIdx];
        if (colorIdx === 0) continue;
        const nx = sx + dx;
        const ny = sy + dy;
        if (nx >= 0 && nx < this.snapshotW && ny >= 0 && ny < this.snapshotH) {
          diffs.push({ x: nx, y: ny, oldIndex: 0, newIndex: colorIdx });
        }
      }
    }

    state.setPreviewPixels(diffs);
  }

  onMouseUp() {
    if (!this.drawing || !this.snapshot || !this.sel) return;
    const state = useEditorStore.getState();
    const preview = state.previewPixels;
    state.setPreviewPixels(null);

    if (preview && preview.length > 0) {
      const sel = this.sel;
      const clearDiffs: PixelDiff[] = [];
      for (let sy = sel.y; sy < sel.y + sel.height; sy++) {
        for (let sx = sel.x; sx < sel.x + sel.width; sx++) {
          if (sx < 0 || sx >= this.snapshotW || sy < 0 || sy >= this.snapshotH) continue;
          const idx = sy * this.snapshotW + sx;
          if (this.snapshot[idx] !== 0) {
            clearDiffs.push({ x: sx, y: sy, oldIndex: this.snapshot[idx], newIndex: 0 });
          }
        }
      }
      state.setPixels(clearDiffs);
      state.setPixels(preview);

      const dx = preview.length > 0 ? preview[0].x - sel.x : 0;
      const dy = preview.length > 0 ? preview[0].y - sel.y : 0;
      state.setSelection({
        x: sel.x + dx,
        y: sel.y + dy,
        width: sel.width,
        height: sel.height,
      });

      state.pushCommand({
        id: nanoid(),
        description: 'Move selection',
        diffs: [...clearDiffs, ...preview],
        layerId: state.activeLayerId!,
        frameId: state.activeFrameId!,
      });
    }

    this.drawing = false;
    this.snapshot = null;
    this.sel = null;
    useEditorStore.getState().setDrawing(false);
  }
}

export class DitherTool implements ToolHandler {
  drawing = false;
  allDiffs: PixelDiff[] = [];

  private isDitherPixel(x: number, y: number): boolean {
    return (x + y) % 2 === 0;
  }

  onMouseDown(x: number, y: number, button: number) {
    const state = useEditorStore.getState();
    const colorIndex = button === 2 ? state.secondaryColorIndex : state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const pixels = getBrushPixels(x, y, state.brushSize, width, height);
    const diffs: PixelDiff[] = pixels
      .filter(p => this.isDitherPixel(p.x, p.y))
      .map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: colorIndex }));
    this.allDiffs = diffs;
    state.setPixels(diffs);
    state.setDrawing(true);
    state.setLastPixel({ x, y });
    this.drawing = true;
  }

  onMouseMove(x: number, y: number) {
    if (!this.drawing) return;
    const state = useEditorStore.getState();
    const lastPixel = state.lastPixel;
    if (!lastPixel) return;
    const colorIndex = state.activeColorIndex;
    const { width, height } = getDocDimensions();
    const points = bresenhamLine(lastPixel.x, lastPixel.y, x, y);
    const newDiffs: PixelDiff[] = [];
    for (const p of points) {
      const pixels = getBrushPixels(p.x, p.y, state.brushSize, width, height);
      for (const px of pixels) {
        if (this.isDitherPixel(px.x, px.y)) {
          newDiffs.push({ x: px.x, y: px.y, oldIndex: 0, newIndex: colorIndex });
        }
      }
    }
    this.allDiffs.push(...newDiffs);
    state.setPixels(newDiffs);
    state.setLastPixel({ x, y });
  }

  onMouseUp() {
    if (this.drawing && this.allDiffs.length > 0) {
      commitDiffs(this.allDiffs, 'Dither');
    }
    this.drawing = false;
    this.allDiffs = [];
    useEditorStore.getState().setDrawing(false);
    useEditorStore.getState().setLastPixel(null);
  }
}

export function createToolHandler(toolType: string): ToolHandler {
  switch (toolType) {
    case 'pencil': return new PencilTool();
    case 'eraser': return new EraserTool();
    case 'bucket': return new BucketTool();
    case 'eyedropper': return new EyedropperTool();
    case 'line': return new LineTool();
    case 'rectangle': return new RectangleTool();
    case 'ellipse': return new EllipseTool();
    case 'selection': return new SelectionTool();
    case 'move': return new MoveTool();
    case 'dither': return new DitherTool();
    default: return new PencilTool();
  }
}

import useEditorStore from '../../store/editorStore';
import type { PixelDiff } from '../../types';

export interface ToolHandler {
  onMouseDown(x: number, y: number, button: number): void;
  onMouseMove(x: number, y: number): void;
  onMouseUp(): void;
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

function floodFill(startX: number, startY: number, newColorIndex: number, pixels: Uint8Array, docWidth: number, docHeight: number): PixelDiff[] {
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
    visited.add(idx);
    diffs.push({ x, y, oldIndex: pixels[idx], newIndex: newColorIndex });
    stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
  }
  return diffs;
}

export class PencilTool implements ToolHandler {
  drawing = false;

  onMouseDown(x: number, y: number, button: number) {
    const state = useEditorStore.getState();
    const colorIndex = button === 2 ? state.secondaryColorIndex : state.activeColorIndex;
    const pixels = getBrushPixels(x, y, state.brushSize, this.getDocWidth(), this.getDocHeight());
    const diffs: PixelDiff[] = pixels.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: colorIndex }));
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
    const points = bresenhamLine(lastPixel.x, lastPixel.y, x, y);
    const allDiffs: PixelDiff[] = [];
    for (const p of points) {
      const pixels = getBrushPixels(p.x, p.y, state.brushSize, this.getDocWidth(), this.getDocHeight());
      for (const px of pixels) {
        allDiffs.push({ x: px.x, y: px.y, oldIndex: 0, newIndex: colorIndex });
      }
    }
    state.setPixels(allDiffs);
    state.setLastPixel({ x, y });
  }

  onMouseUp() {
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
    useEditorStore.getState().setLastPixel(null);
  }

  private getDocWidth(): number {
    const state = useEditorStore.getState();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    return doc?.width ?? 32;
  }

  private getDocHeight(): number {
    const state = useEditorStore.getState();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    return doc?.height ?? 32;
  }
}

export class EraserTool implements ToolHandler {
  drawing = false;

  onMouseDown(x: number, y: number) {
    const state = useEditorStore.getState();
    const pixels = getBrushPixels(x, y, state.brushSize, this.getDocWidth(), this.getDocHeight());
    const diffs: PixelDiff[] = pixels.map(p => ({ x: p.x, y: p.y, oldIndex: 0, newIndex: 0 }));
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
    const points = bresenhamLine(lastPixel.x, lastPixel.y, x, y);
    const allDiffs: PixelDiff[] = [];
    for (const p of points) {
      const pixels = getBrushPixels(p.x, p.y, state.brushSize, this.getDocWidth(), this.getDocHeight());
      for (const px of pixels) {
        allDiffs.push({ x: px.x, y: px.y, oldIndex: 0, newIndex: 0 });
      }
    }
    state.setPixels(allDiffs);
    state.setLastPixel({ x, y });
  }

  onMouseUp() {
    this.drawing = false;
    useEditorStore.getState().setDrawing(false);
    useEditorStore.getState().setLastPixel(null);
  }

  private getDocWidth(): number {
    const state = useEditorStore.getState();
    return state.project?.documents.find(d => d.id === state.activeDocumentId)?.width ?? 32;
  }

  private getDocHeight(): number {
    const state = useEditorStore.getState();
    return state.project?.documents.find(d => d.id === state.activeDocumentId)?.height ?? 32;
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
    const diffs = floodFill(x, y, colorIndex, layer.pixels, doc.width, doc.height);
    if (diffs.length > 0) {
      state.setPixels(diffs);
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

export function createToolHandler(toolType: string): ToolHandler {
  switch (toolType) {
    case 'pencil': return new PencilTool();
    case 'eraser': return new EraserTool();
    case 'bucket': return new BucketTool();
    case 'eyedropper': return new EyedropperTool();
    default: return new PencilTool();
  }
}
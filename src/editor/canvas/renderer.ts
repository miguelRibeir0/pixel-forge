import useEditorStore from '../../store/editorStore';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    this.ctx = ctx;
    this.offscreenCanvas = document.createElement('canvas');
    const offCtx = this.offscreenCanvas.getContext('2d');
    if (!offCtx) throw new Error('Could not get offscreen 2D context');
    this.offscreenCtx = offCtx;
  }

  render() {
    const state = useEditorStore.getState();
    const { project, activeDocumentId, activeFrameId } = state;
    if (!project || !activeDocumentId || !activeFrameId) return;

    const doc = project.documents.find(d => d.id === activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === activeFrameId);
    if (!frame) return;

    let { showGrid, gridOpacity, fitMode, zoom, panX, panY } = state.canvas;
    const { width: docW, height: docH } = doc;

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    if (fitMode && canvasWidth > 0 && canvasHeight > 0) {
      const padding = 40;
      const availW = canvasWidth - padding * 2;
      const availH = canvasHeight - padding * 2;
      const newZoom = Math.max(1, Math.min(availW / docW, availH / docH));
      const newPanX = (canvasWidth - docW * newZoom) / 2;
      const newPanY = (canvasHeight - docH * newZoom) / 2;

      if (zoom !== newZoom || panX !== newPanX || panY !== newPanY) {
        zoom = newZoom;
        panX = newPanX;
        panY = newPanY;
        useEditorStore.setState({
          canvas: { ...state.canvas, zoom, panX, panY },
        });
      }
    }

    this.offscreenCanvas.width = docW;
    this.offscreenCanvas.height = docH;
    this.offscreenCtx.clearRect(0, 0, docW, docH);

    const palette = project.palette.colors;

    for (const layer of frame.layers) {
      if (!layer.visible) continue;
      this.offscreenCtx.globalAlpha = layer.opacity;
      this.offscreenCtx.globalCompositeOperation = layer.blendMode;
      for (let y = 0; y < docH; y++) {
        for (let x = 0; x < docW; x++) {
          const colorIdx = layer.pixels[y * docW + x];
          if (colorIdx === 0) continue;
          this.offscreenCtx.fillStyle = palette[colorIdx] || '#000000';
          this.offscreenCtx.fillRect(x, y, 1, 1);
        }
      }
    }

    this.offscreenCtx.globalAlpha = 1;
    this.offscreenCtx.globalCompositeOperation = 'source-over';

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.imageSmoothingEnabled = false;

    this.drawCheckerboard(canvasWidth, canvasHeight, docW, docH, zoom, panX, panY);

    const destX = panX;
    const destY = panY;
    const destW = docW * zoom;
    const destH = docH * zoom;
    this.ctx.drawImage(this.offscreenCanvas, destX, destY, destW, destH);

    if (showGrid) {
      this.drawGrid(destX, destY, docW, docH, zoom, gridOpacity);
    }

    const preview = state.previewPixels;
    if (preview && preview.length > 0) {
      for (const p of preview) {
        if (p.x < 0 || p.y < 0 || p.x >= docW || p.y >= docH) continue;
        if (p.newIndex === 0) continue;
        const color = palette[p.newIndex] || '#000000';
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillRect(destX + p.x * zoom, destY + p.y * zoom, zoom, zoom);
      }
      this.ctx.globalAlpha = 1;
    }

    const sel = state.selection;
    if (sel) {
      this.ctx.strokeStyle = '#7c3aed';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(
        destX + sel.x * zoom,
        destY + sel.y * zoom,
        sel.width * zoom,
        sel.height * zoom
      );
      this.ctx.setLineDash([]);
    }

    const cursor = state.cursorPixel;
    const tool = state.activeTool;
    if (cursor) {
      const half = Math.floor(state.brushSize / 2);
      const bx = cursor.x - half;
      const by = cursor.y - half;
      const bw = state.brushSize;
      const bh = state.brushSize;
      const minSize = Math.max(bw * zoom, 6);
      const rx = destX + bx * zoom;
      const ry = destY + by * zoom;
      const rw = bw * zoom;
      const rh = bh * zoom;

      if (tool === 'eraser') {
        this.ctx.globalAlpha = 0.4;
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(rx, ry, Math.max(rw, minSize), Math.max(rh, minSize));
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
      } else if (['pencil', 'dither', 'line', 'rectangle', 'ellipse'].includes(tool)) {
        const color = palette[state.activeColorIndex] || '#ffffff';
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(rx, ry, Math.max(rw, minSize), Math.max(rh, minSize));
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rx + 0.5, ry + 0.5, Math.max(rw, minSize) - 1, Math.max(rh, minSize) - 1);
        this.ctx.globalAlpha = 1;
      } else {
        const size = Math.max(zoom, 6);
        const cx = destX + cursor.x * zoom + zoom / 2;
        const cy = destY + cursor.y * zoom + zoom / 2;
        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - size / 2, cy);
        this.ctx.lineTo(cx + size / 2, cy);
        this.ctx.moveTo(cx, cy - size / 2);
        this.ctx.lineTo(cx, cy + size / 2);
        this.ctx.stroke();
      }
    }
  }

  private drawCheckerboard(
    cw: number, ch: number,
    docW: number, docH: number,
    zoom: number, panX: number, panY: number
  ) {
    const checkSize = Math.max(1, Math.floor(zoom / 2));
    const startX = panX;
    const startY = panY;
    const endX = panX + docW * zoom;
    const endY = panY + docH * zoom;

    const clampedStartX = Math.max(0, startX);
    const clampedStartY = Math.max(0, startY);
    const clampedEndX = Math.min(cw, endX);
    const clampedEndY = Math.min(ch, endY);

    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(clampedStartX, clampedStartY, clampedEndX - clampedStartX, clampedEndY - clampedStartY);

    this.ctx.fillStyle = '#222244';
    for (let y = clampedStartY; y < clampedEndY; y += checkSize * 2) {
      for (let x = clampedStartX; x < clampedEndX; x += checkSize * 2) {
        const localX = x - panX;
        const localY = y - panY;
        const checkX = Math.floor(localX / checkSize);
        const checkY = Math.floor(localY / checkSize);
        if ((checkX + checkY) % 2 === 1) {
          this.ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
    }
  }

  private drawGrid(ox: number, oy: number, docW: number, docH: number, zoom: number, opacity: number) {
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
    this.ctx.lineWidth = 1;

    for (let x = 0; x <= docW; x++) {
      const px = Math.floor(ox + x * zoom) + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(px, oy);
      this.ctx.lineTo(px, oy + docH * zoom);
      this.ctx.stroke();
    }
    for (let y = 0; y <= docH; y++) {
      const py = Math.floor(oy + y * zoom) + 0.5;
      this.ctx.beginPath();
      this.ctx.moveTo(ox, py);
      this.ctx.lineTo(ox + docW * zoom, py);
      this.ctx.stroke();
    }
  }

  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } | null {
    const state = useEditorStore.getState();
    const { project, activeDocumentId, canvas } = state;
    if (!project || !activeDocumentId) return null;
    const doc = project.documents.find(d => d.id === activeDocumentId);
    if (!doc) return null;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (screenX - rect.left) * scaleX;
    const canvasY = (screenY - rect.top) * scaleY;

    const pixelX = Math.floor((canvasX - canvas.panX) / canvas.zoom);
    const pixelY = Math.floor((canvasY - canvas.panY) / canvas.zoom);

    if (pixelX < 0 || pixelX >= doc.width || pixelY < 0 || pixelY >= doc.height) {
      return null;
    }

    return { x: pixelX, y: pixelY };
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.render();
  }
}
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
    const { project, activeDocumentId, activeFrameId, canvas } = state;
    if (!project || !activeDocumentId || !activeFrameId) return;

    const doc = project.documents.find(d => d.id === activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === activeFrameId);
    if (!frame) return;

    const { zoom, panX, panY, showGrid, gridOpacity } = canvas;
    const { width: docW, height: docH } = doc;

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

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.imageSmoothingEnabled = false;

    this.drawCheckerboard(canvasWidth, canvasHeight, docW, docH, zoom, panX, panY);

    const destX = panX;
    const destY = panY;
    const destW = docW * zoom;
    const destH = docH * zoom;
    this.ctx.drawImage(this.offscreenCanvas, destX, destY, destW, destH);

    if (showGrid && zoom >= 4) {
      this.drawGrid(destX, destY, docW, docH, zoom, gridOpacity);
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
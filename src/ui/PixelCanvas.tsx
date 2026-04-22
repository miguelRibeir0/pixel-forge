import { useEffect, useRef, useCallback } from 'react';
import useEditorStore from '../store/editorStore';
import { CanvasRenderer } from '../editor/canvas';
import { createToolHandler } from '../editor/tools';
import type { ToolHandler } from '../editor/tools';

export default function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const toolRef = useRef<ToolHandler | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTool = useEditorStore(s => s.activeTool);
  const zoom = useEditorStore(s => s.canvas.zoom);
  const project = useEditorStore(s => s.project);
  const setZoom = useEditorStore(s => s.setZoom);
  const setPan = useEditorStore(s => s.setPan);
  const isDrawing = useEditorStore(s => s.isDrawing);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    toolRef.current = createToolHandler(activeTool);
  }, [activeTool]);

  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);
  }, []);

  useEffect(() => {
    if (!rendererRef.current) return;
    rendererRef.current.render();
  }, [project, zoom, isDrawing]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      rendererRef.current?.render();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (!rendererRef.current) return;
    const pos = rendererRef.current.screenToCanvas(e.clientX, e.clientY);
    if (pos) {
      toolRef.current?.onMouseDown(pos.x, pos.y, e.button);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      const state = useEditorStore.getState();
      panRef.current = { x: state.canvas.panX + dx, y: state.canvas.panY + dy };
      setPan(panRef.current.x, panRef.current.y);
      rendererRef.current?.render();
      return;
    }
    if (!rendererRef.current) return;
    const pos = rendererRef.current.screenToCanvas(e.clientX, e.clientY);
    if (pos && useEditorStore.getState().isDrawing) {
      toolRef.current?.onMouseMove(pos.x, pos.y);
    }
  }, [setPan]);

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    toolRef.current?.onMouseUp();
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const state = useEditorStore.getState();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newZoom = Math.min(3200, Math.max(1, state.canvas.zoom + delta * (state.canvas.zoom < 16 ? 1 : state.canvas.zoom < 64 ? 4 : 8)));
    setZoom(newZoom);
    rendererRef.current?.render();
  }, [setZoom]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  requestAnimationFrame(() => {
    rendererRef.current?.render();
  });

  return (
    <div ref={containerRef} className="flex-1 overflow-hidden relative bg-canvas-bg cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="absolute inset-0"
      />
      <div className="absolute bottom-2 right-2 text-xs text-text-secondary bg-bg-primary/80 px-2 py-1 rounded">
        {zoom}x
      </div>
    </div>
  );
}
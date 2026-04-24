import { useEffect, useRef, useCallback } from "react";
import useEditorStore from "../store/editorStore";
import { CanvasRenderer } from "../editor/canvas";
import { createToolHandler } from "../editor/tools";
import type { ToolHandler } from "../editor/tools";

export default function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const toolRef = useRef<ToolHandler | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTool = useEditorStore((s) => s.activeTool);
  const zoom = useEditorStore((s) => s.canvas.zoom);
  const fitMode = useEditorStore((s) => s.canvas.fitMode);
  const project = useEditorStore((s) => s.project);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const previewPixels = useEditorStore((s) => s.previewPixels);
  const cursorPixel = useEditorStore((s) => s.cursorPixel);
  const panRef = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spaceHeld = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        spaceHeld.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeld.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

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
  }, [project, zoom, isDrawing, fitMode, previewPixels, cursorPixel]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !canvasRef.current) return;
    const canvas = canvasRef.current;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      rendererRef.current?.render();
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button === 1 || (e.button === 0 && (e.altKey || spaceHeld.current))) {
      isPanning.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      return;
    }
    if (!rendererRef.current) return;
    const pos = rendererRef.current.screenToCanvas(e.clientX, e.clientY);
    if (pos) {
      toolRef.current?.onMouseDown(pos.x, pos.y, e.button);
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        const state = useEditorStore.getState();
        panRef.current = {
          x: state.canvas.panX + dx,
          y: state.canvas.panY + dy,
        };
        setPan(panRef.current.x, panRef.current.y);
        rendererRef.current?.render();
        return;
      }
      if (!rendererRef.current) return;
      const pos = rendererRef.current.screenToCanvas(e.clientX, e.clientY);
      useEditorStore.getState().setCursorPixel(pos);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.cursor = pos ? "none" : "default";
      }
      if (pos && useEditorStore.getState().isDrawing) {
        toolRef.current?.onMouseMove(pos.x, pos.y);
      }
      rendererRef.current.render();
    },
    [setPan],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    toolRef.current?.onMouseUp();
  }, []);

  const handleMouseLeave = useCallback(() => {
    useEditorStore.getState().setCursorPixel(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "default";
    }
    if (isPanning.current) {
      isPanning.current = false;
    }
    toolRef.current?.onMouseUp();
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const state = useEditorStore.getState();
      const delta = e.deltaY > 0 ? -1 : 1;

      if (e.altKey) {
        const newBrush = Math.max(1, Math.min(32, state.brushSize + delta));
        state.setBrushSize(newBrush);
        rendererRef.current?.render();
        return;
      }

      const currentZoom = state.canvas.zoom;
      const step = currentZoom < 16 ? 1 : currentZoom < 64 ? 4 : 8;
      const newZoom = Math.min(
        3200,
        Math.max(1, Math.round(currentZoom) + delta * step),
      );
      setZoom(newZoom);
      rendererRef.current?.render();
    },
    [setZoom],
  );

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const displayZoom = fitMode ? zoom.toFixed(1) : zoom;

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative bg-canvas-bg"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        className="absolute inset-0"
      />
      <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
        <span className="text-xs text-text-muted bg-bg-primary/80 backdrop-blur-sm px-2 py-1 rounded border border-border-subtle">
          {project?.documents[0]?.width ?? 0}×
          {project?.documents[0]?.height ?? 0}
        </span>
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1">
        <button
          onClick={() => {
            const s = useEditorStore.getState();
            useEditorStore.setState({
              canvas: { ...s.canvas, fitMode: !s.canvas.fitMode },
            });
            rendererRef.current?.render();
          }}
          className={`text-xs rounded-l h-5 w-5 transition-all duration-150 ${
            fitMode
              ? "bg-accent text-bg-primary font-bold"
              : "bg-bg-primary/80 backdrop-blur-sm text-text-muted hover:text-text-secondary border border-border-subtle"
          }`}
          title="Fit canvas to view"
        >
          FIT
        </button>
        <span
          className={`text-xs rounded-r h-5 w-5 text-center tabular-nums ${
            fitMode
              ? "bg-accent/80 text-bg-primary"
              : "bg-bg-primary/80 backdrop-blur-sm text-text-muted border border-l-0 border-border-subtle"
          }`}
        >
          {displayZoom}x
        </span>
      </div>
    </div>
  );
}

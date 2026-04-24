import { useEffect } from 'react';
import useEditorStore from '../store/editorStore';
import type { ToolType } from '../types';

const TOOL_SHORTCUTS: Record<string, ToolType> = {
  b: 'pencil',
  e: 'eraser',
  g: 'bucket',
  i: 'eyedropper',
  l: 'line',
  r: 'rectangle',
  s: 'selection',
  m: 'move',
  d: 'dither',
};

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const state = useEditorStore.getState();

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        state.undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        state.redo();
        return;
      }

      if (e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();

      if (key in TOOL_SHORTCUTS) {
        e.preventDefault();
        state.setActiveTool(TOOL_SHORTCUTS[key]);
        return;
      }

      if (key === 'x') {
        e.preventDefault();
        const primary = state.activeColorIndex;
        const secondary = state.secondaryColorIndex;
        state.setActiveColorIndex(secondary);
        state.setSecondaryColorIndex(primary);
        return;
      }

      if (key === '[') {
        e.preventDefault();
        state.setBrushSize(Math.max(1, state.brushSize - 1));
        return;
      }
      if (key === ']') {
        e.preventDefault();
        state.setBrushSize(Math.min(32, state.brushSize + 1));
        return;
      }

      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const z = state.canvas.zoom;
        const step = z < 16 ? 1 : z < 64 ? 4 : 8;
        state.setZoom(Math.min(3200, Math.round(z) + step));
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        const z = state.canvas.zoom;
        const step = z < 16 ? 1 : z < 64 ? 4 : 8;
        state.setZoom(Math.max(1, Math.round(z) - step));
        return;
      }

      if (key === 'h') {
        e.preventDefault();
        state.toggleGrid();
        return;
      }

      if (e.key === 'Escape') {
        state.setSelection(null);
        state.setPreviewPixels(null);
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

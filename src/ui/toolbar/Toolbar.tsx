import useEditorStore from '../../store/editorStore';
import type { ToolType } from '../../types';
import {
  Pencil,
  Eraser,
  PaintBucket,
  Pipette,
  Minus,
  Square,
  Circle,
  Scan,
  Move,
  Grid2x2,
} from 'lucide-react';

const TOOLS: { id: ToolType; label: string; icon: React.ElementType; shortcut: string }[] = [
  { id: 'pencil', label: 'Pencil', icon: Pencil, shortcut: 'B' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'E' },
  { id: 'bucket', label: 'Fill', icon: PaintBucket, shortcut: 'G' },
  { id: 'eyedropper', label: 'Picker', icon: Pipette, shortcut: 'I' },
  { id: 'line', label: 'Line', icon: Minus, shortcut: 'L' },
  { id: 'rectangle', label: 'Rect', icon: Square, shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: Circle, shortcut: 'Shift+R' },
  { id: 'selection', label: 'Select', icon: Scan, shortcut: 'S' },
  { id: 'move', label: 'Move', icon: Move, shortcut: 'M' },
  { id: 'dither', label: 'Dither', icon: Grid2x2, shortcut: 'D' },
];

export default function Toolbar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const brushSize = useEditorStore(s => s.brushSize);
  const setBrushSize = useEditorStore(s => s.setBrushSize);
  const showGrid = useEditorStore(s => s.canvas.showGrid);
  const toggleGrid = useEditorStore(s => s.toggleGrid);

  return (
    <div className="w-12 bg-bg-secondary flex flex-col border-r border-border select-none">
      <div className="flex flex-col items-center py-1.5 gap-0.5">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-8 h-8 flex items-center justify-center rounded transition-all duration-150 ${
                isActive
                  ? 'bg-accent-dim text-accent shadow-sm shadow-accent/20'
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
            </button>
          );
        })}
      </div>

      <div className="mx-2 h-px bg-border-subtle my-1" />

      <div className="flex flex-col items-center gap-0.5 mx-1.5">
        <button
          onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
          className="w-full h-6 text-sm text-text-muted hover:text-text-primary hover:bg-surface flex items-center justify-center rounded transition-colors"
          title="Decrease brush"
        >
          −
        </button>
        <span className="text-sm text-text-primary font-bold">{brushSize}</span>
        <button
          onClick={() => setBrushSize(Math.min(32, brushSize + 1))}
          className="w-full h-6 text-sm text-text-muted hover:text-text-primary hover:bg-surface flex items-center justify-center rounded transition-colors"
          title="Increase brush"
        >
          +
        </button>
      </div>

      <div className="mx-2 h-px bg-border-subtle my-1" />

      <button
        onClick={toggleGrid}
        className={`mx-1.5 h-7 flex items-center justify-center text-xs rounded transition-all duration-150 ${
          showGrid
            ? 'bg-accent-dim text-accent border border-accent/30'
            : 'text-text-muted hover:bg-surface hover:text-text-secondary border border-transparent'
        }`}
        title="Toggle Grid"
      >
        GRID
      </button>
    </div>
  );
}

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
    <div className="w-14 bg-bg-secondary flex flex-col border-r-2 border-border select-none">
      <div className="px-1 py-1 border-b-2 border-border bg-bg-tertiary">
        <span className="text-base text-text-secondary uppercase tracking-wider">TOOLS</span>
      </div>
      <div className="flex flex-col items-center py-1 gap-0">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`w-9 h-8 flex items-center justify-center transition-colors border-2 my-px ${
                activeTool === tool.id
                  ? 'border-accent text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary border-transparent hover:border-border'
              }`}
              title={`${tool.label} (${tool.shortcut})`}
            >
              <Icon size={16} strokeWidth={2} />
            </button>
          );
        })}
      </div>

      <div className="mx-2 h-px bg-border my-1" />

      <div className="flex flex-col items-center gap-0 mx-1 border-2 border-border">
        <button
          onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
          className="w-full h-6 text-base text-text-secondary hover:bg-surface-hover hover:text-text-primary flex items-center justify-center border-b border-border"
          title="Decrease brush"
        >
          -
        </button>
        <span className="text-base text-text-primary py-0.5">{brushSize}</span>
        <button
          onClick={() => setBrushSize(Math.min(32, brushSize + 1))}
          className="w-full h-6 text-base text-text-secondary hover:bg-surface-hover hover:text-text-primary flex items-center justify-center border-t border-border"
          title="Increase brush"
        >
          +
        </button>
      </div>

      <div className="mx-2 h-px bg-border my-1" />

      <button
        onClick={toggleGrid}
        className={`mx-1 h-7 flex items-center justify-center text-sm border-2 transition-colors ${
          showGrid ? 'bg-accent-dim text-accent border-accent' : 'text-text-secondary hover:bg-surface-hover border-transparent hover:border-border'
        }`}
        title="Toggle Grid"
      >
        GRID
      </button>
    </div>
  );
}

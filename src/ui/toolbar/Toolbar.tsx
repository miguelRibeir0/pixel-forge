import useEditorStore from '../../store/editorStore';
import type { ToolType } from '../../types';

const TOOLS: { id: ToolType; label: string; icon: string }[] = [
  { id: 'pencil', label: 'Pencil', icon: '✏' },
  { id: 'eraser', label: 'Eraser', icon: '⌫' },
  { id: 'bucket', label: 'Fill', icon: '🪣' },
  { id: 'eyedropper', label: 'Picker', icon: '💉' },
  { id: 'line', label: 'Line', icon: '╲' },
  { id: 'rectangle', label: 'Rect', icon: '▢' },
  { id: 'ellipse', label: 'Ellipse', icon: '○' },
  { id: 'selection', label: 'Select', icon: '⬚' },
  { id: 'move', label: 'Move', icon: '✥' },
  { id: 'dither', label: 'Dither', icon: '▦' },
];

export default function Toolbar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const setActiveTool = useEditorStore(s => s.setActiveTool);
  const brushSize = useEditorStore(s => s.brushSize);
  const setBrushSize = useEditorStore(s => s.setBrushSize);
  const showGrid = useEditorStore(s => s.canvas.showGrid);
  const toggleGrid = useEditorStore(s => s.toggleGrid);

  return (
    <div className="w-12 bg-surface flex flex-col items-center py-2 gap-1 border-r border-border">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(tool.id)}
          className={`w-9 h-9 rounded flex items-center justify-center text-sm transition-colors ${
            activeTool === tool.id
              ? 'bg-accent text-white shadow-lg shadow-accent/30'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      <div className="w-8 h-px bg-border my-1" />

      <div className="flex flex-col items-center gap-1">
        <button
          onClick={() => setBrushSize(Math.max(1, brushSize - 1))}
          className="w-9 h-7 rounded text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary flex items-center justify-center"
          title="Decrease brush"
        >
          −
        </button>
        <span className="text-xs text-text-primary font-mono">{brushSize}</span>
        <button
          onClick={() => setBrushSize(Math.min(32, brushSize + 1))}
          className="w-9 h-7 rounded text-xs text-text-secondary hover:bg-surface-hover hover:text-text-primary flex items-center justify-center"
          title="Increase brush"
        >
          +
        </button>
      </div>

      <div className="w-8 h-px bg-border my-1" />

      <button
        onClick={toggleGrid}
        className={`w-9 h-9 rounded flex items-center justify-center text-sm ${
          showGrid ? 'bg-accent/20 text-accent' : 'text-text-secondary hover:bg-surface-hover'
        }`}
        title="Toggle Grid"
      >
        ▦
      </button>
    </div>
  );
}
import useEditorStore from '../../store/editorStore';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';

export default function LayerPanel() {
  const project = useEditorStore(s => s.project);
  const activeLayerId = useEditorStore(s => s.activeLayerId);
  const setActiveLayer = useEditorStore(s => s.setActiveLayer);
  const toggleLayerVisibility = useEditorStore(s => s.toggleLayerVisibility);
  const setLayerOpacity = useEditorStore(s => s.setLayerOpacity);
  const removeLayer = useEditorStore(s => s.removeLayer);
  const addLayer = useEditorStore(s => s.addLayer);
  const activeFrameId = useEditorStore(s => s.activeFrameId);

  if (!project) return null;

  const doc = project.documents.find(d => d.id === useEditorStore.getState().activeDocumentId);
  if (!doc) return null;

  const frame = doc.frames.find(f => f.id === activeFrameId);
  if (!frame) return null;

  const layers = [...frame.layers].reverse();

  return (
    <div className="bg-bg-secondary flex flex-col flex-1 select-none min-h-0">
      <div className="flex items-center justify-between panel-header">
        <span>Layers</span>
        <button
          onClick={() => addLayer()}
          className="w-5 h-5 flex items-center justify-center rounded text-text-muted hover:text-accent hover:bg-accent-dim transition-colors"
          title="Add Layer"
        >
          <Plus size={12} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors border-l-2 ${
                isActive
                  ? 'bg-accent-dim border-l-accent'
                  : 'border-l-transparent hover:bg-surface'
              }`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                className={`flex-shrink-0 transition-colors ${layer.visible ? 'text-text-secondary hover:text-accent' : 'text-text-muted/40'}`}
                title={layer.visible ? 'Hide' : 'Show'}
              >
                {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
              </button>
              <span className={`text-sm flex-1 truncate ${isActive ? 'text-text-primary' : 'text-text-secondary'}`}>
                {layer.name}
              </span>
              <span className="text-xs text-text-muted tabular-nums">
                {Math.round(layer.opacity * 100)}%
              </span>
              {frame.layers.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  className="flex-shrink-0 text-text-muted/40 hover:text-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {activeLayerId && (
        <div className="px-2 py-2 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-text-muted uppercase tracking-wide">Opacity</label>
            <span className="text-xs text-text-secondary tabular-nums">
              {Math.round((frame.layers.find(l => l.id === activeLayerId)?.opacity ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={frame.layers.find(l => l.id === activeLayerId)?.opacity ?? 1}
            onChange={(e) => setLayerOpacity(activeLayerId, parseInt(e.target.value) / 100)}
            className="w-full h-1.5 accent-accent rounded-full appearance-none bg-surface cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}

import useEditorStore from '../../store/editorStore';

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
      <div className="flex items-center justify-between px-2 py-1 border-b-2 border-border bg-bg-tertiary">
        <span className="text-base text-text-secondary uppercase tracking-wider">LAYERS</span>
        <button
          onClick={() => addLayer()}
          className="w-6 h-6 text-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover flex items-center justify-center border border-transparent hover:border-border"
          title="Add Layer"
        >
          +
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`flex items-center gap-2 px-2 py-1 cursor-pointer border-b border-border transition-colors ${
              layer.id === activeLayerId
                ? 'bg-accent-dim border-l-4 border-l-accent'
                : 'hover:bg-surface-hover border-l-4 border-l-transparent'
            }`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
              className={`w-5 h-5 text-base flex items-center justify-center ${layer.visible ? 'text-accent' : 'text-text-secondary/40'}`}
              title={layer.visible ? 'Hide' : 'Show'}
            >
              {layer.visible ? '[+]' : '[-]'}
            </button>
            <span className={`text-base flex-1 truncate ${layer.id === activeLayerId ? 'text-text-primary' : 'text-text-secondary'}`}>
              {layer.name}
            </span>
            <span className="text-sm text-text-secondary/50">
              {Math.round(layer.opacity * 100)}%
            </span>
            {frame.layers.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                className="w-5 h-5 text-base text-text-secondary/40 hover:text-danger flex items-center justify-center border border-transparent hover:border-danger"
                title="Delete"
              >
                x
              </button>
            )}
          </div>
        ))}
      </div>
      {activeLayerId && (
        <div className="px-2 py-2 border-t-2 border-border">
          <label className="text-sm text-text-secondary uppercase">OPACITY</label>
          <input
            type="range"
            min={0}
            max={100}
            value={frame.layers.find(l => l.id === activeLayerId)?.opacity ?? 1}
            onChange={(e) => setLayerOpacity(activeLayerId, parseInt(e.target.value) / 100)}
            className="w-full h-2 accent-accent mt-1"
          />
        </div>
      )}
    </div>
  );
}

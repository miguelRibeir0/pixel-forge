import useEditorStore from '../../store/editorStore';

export default function Timeline() {
  const project = useEditorStore(s => s.project);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const activeFrameId = useEditorStore(s => s.activeFrameId);
  
  const setActiveFrame = useEditorStore(s => s.setActiveFrame);
  const addFrame = useEditorStore(s => s.addFrame);
  const removeFrame = useEditorStore(s => s.removeFrame);
  const duplicateFrame = useEditorStore(s => s.duplicateFrame);

  if (!project || !activeDocumentId) return null;

  const doc = project.documents.find(d => d.id === activeDocumentId);
  if (!doc) return null;

  return (
    <div className="bg-surface border-t border-border">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">Timeline</span>
        <div className="flex gap-1">
          <button
            onClick={addFrame}
            className="px-2 py-0.5 text-[10px] bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
          >
            + Frame
          </button>
        </div>
      </div>
      <div className="flex gap-1 p-2 overflow-x-auto">
        {doc.frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => setActiveFrame(frame.id)}
            className={`flex-shrink-0 w-16 h-20 rounded border cursor-pointer transition-colors ${
              frame.id === activeFrameId
                ? 'border-accent bg-accent/10'
                : 'border-border hover:border-text-secondary/30 bg-bg-primary'
            }`}
          >
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[9px] text-text-secondary">{index + 1}</span>
              <div className="flex gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateFrame(frame.id); }}
                  className="text-[9px] text-text-secondary/50 hover:text-text-primary"
                  title="Duplicate"
                >
                  ⧉
                </button>
                {doc.frames.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }}
                    className="text-[9px] text-text-secondary/50 hover:text-danger"
                    title="Delete"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-12">
              <span className="text-[9px] text-text-secondary/60">{frame.layers.length}L</span>
              <span className="text-[9px] text-text-secondary/40">{frame.duration}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
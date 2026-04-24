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
    <div className="bg-bg-secondary border-t-2 border-border select-none">
      <div className="flex items-center justify-between px-2 py-1 border-b-2 border-border bg-bg-tertiary">
        <span className="text-base text-text-secondary uppercase tracking-wider">TIMELINE</span>
        <div className="flex gap-0">
          <button
            onClick={addFrame}
            className="px-2 py-0.5 text-base bg-accent-dim text-accent border-2 border-accent hover:bg-accent hover:text-bg-primary transition-colors"
          >
            + FRAME
          </button>
        </div>
      </div>
      <div className="flex gap-0 p-2 overflow-x-auto">
        {doc.frames.map((frame, index) => (
          <div
            key={frame.id}
            onClick={() => setActiveFrame(frame.id)}
            className={`flex-shrink-0 w-20 h-24 border-2 cursor-pointer transition-colors mr-2 ${
              frame.id === activeFrameId
                ? 'border-accent bg-accent-dim'
                : 'border-border hover:border-text-secondary bg-bg-primary'
            }`}
          >
            <div className="flex items-center justify-between px-1 pt-1 border-b border-border">
              <span className="text-sm text-text-secondary">{index + 1}</span>
              <div className="flex gap-0">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateFrame(frame.id); }}
                  className="text-sm text-text-secondary/50 hover:text-text-primary px-1"
                  title="Duplicate"
                >
                  ++
                </button>
                {doc.frames.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }}
                    className="text-sm text-text-secondary/50 hover:text-danger px-1"
                    title="Delete"
                  >
                    x
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-14">
              <span className="text-sm text-text-secondary/60">{frame.layers.length}L</span>
              <span className="text-sm text-text-secondary/40">{frame.duration}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

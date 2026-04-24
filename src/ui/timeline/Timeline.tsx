import useEditorStore from '../../store/editorStore';
import { Plus, Copy, X } from 'lucide-react';

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
    <div className="bg-bg-secondary border-t border-border select-none">
      <div className="flex items-center justify-between px-3 py-1 border-b border-border bg-bg-tertiary">
        <span className="text-xs text-text-muted uppercase tracking-wider">Timeline</span>
        <button
          onClick={addFrame}
          className="flex items-center gap-1 px-2 py-0.5 text-xs btn-accent rounded"
        >
          <Plus size={10} />
          Frame
        </button>
      </div>
      <div className="flex gap-1.5 p-2 overflow-x-auto">
        {doc.frames.map((frame, index) => {
          const isActive = frame.id === activeFrameId;
          return (
            <div
              key={frame.id}
              onClick={() => setActiveFrame(frame.id)}
              className={`flex-shrink-0 w-18 rounded-md cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-accent-dim border border-accent/40 shadow-sm shadow-accent/10'
                  : 'bg-surface border border-border hover:border-border-light'
              }`}
            >
              <div className="flex items-center justify-between px-1.5 pt-1 pb-0.5">
                <span className={`text-xs font-bold ${isActive ? 'text-accent' : 'text-text-muted'}`}>
                  {index + 1}
                </span>
                <div className="flex gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); duplicateFrame(frame.id); }}
                    className="text-text-muted/50 hover:text-text-primary transition-colors p-0.5"
                    title="Duplicate"
                  >
                    <Copy size={10} />
                  </button>
                  {doc.frames.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFrame(frame.id); }}
                      className="text-text-muted/50 hover:text-danger transition-colors p-0.5"
                      title="Delete"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center pb-1.5 px-1.5">
                <span className="text-xs text-text-muted">{frame.layers.length}L</span>
                <span className="text-xs text-text-muted/60 tabular-nums">{frame.duration}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

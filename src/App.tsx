import { useState, useEffect } from 'react';
import useEditorStore from './store/editorStore';
import PixelCanvas from './ui/PixelCanvas';
import Toolbar from './ui/toolbar/Toolbar';
import ColorPalette from './ui/panels/ColorPalette';
import LayerPanel from './ui/panels/LayerPanel';
import Timeline from './ui/timeline/Timeline';
import ProjectSelector from './ui/ProjectSelector';
import { useKeyboardShortcuts } from './editor/shortcuts';
import { loadLastProject, saveProject, saveProjectSync } from './storage/indexeddb';

function EditorHeader() {
  const projectName = useEditorStore(s => s.project?.name);
  const docWidth = useEditorStore(s => s.project?.documents[0]?.width);
  const docHeight = useEditorStore(s => s.project?.documents[0]?.height);
  const zoom = useEditorStore(s => s.canvas.zoom);
  const fitMode = useEditorStore(s => s.canvas.fitMode);
  const clearProject = useEditorStore(s => s.clearProject);
  const displayZoom = fitMode ? zoom.toFixed(1) : zoom;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-accent tracking-wider">PIXEL FORGE</span>
        <span className="text-xs text-text-secondary">—</span>
        <button
          onClick={clearProject}
          className="text-xs text-text-secondary hover:text-text-primary transition-colors"
          title="Switch project"
        >
          {projectName}
        </button>
        {docWidth && docHeight && (
          <span className="text-[10px] text-text-secondary/50">
            ({docWidth}×{docHeight})
          </span>
        )}
      </div>
      <span className="text-[10px] text-text-secondary/50">Zoom: {displayZoom}x</span>
    </div>
  );
}

function EditorScreen() {
  useKeyboardShortcuts();
  return (
    <div className="w-full h-full flex flex-col">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        <Toolbar />
        <PixelCanvas />
        <div className="w-48 flex flex-col">
          <ColorPalette />
          <LayerPanel />
        </div>
      </div>
      <Timeline />
    </div>
  );
}

export default function App() {
  const project = useEditorStore(s => s.project);
  const setProject = useEditorStore(s => s.setProject);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLastProject().then(saved => {
      if (saved) {
        setProject(saved);
      }
      setLoading(false);
    });
  }, [setProject]);

  useEffect(() => {
    if (!project) return;

    const unsub = useEditorStore.subscribe((state) => {
      const proj = state.project;
      if (proj) {
        saveProject({ ...proj, canvasState: state.canvas });
      }
    });

    const handlePageHide = () => {
      const state = useEditorStore.getState();
      if (state.project) {
        saveProjectSync({ ...state.project, canvasState: state.canvas });
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handlePageHide();
    });

    return () => {
      unsub();
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [project]);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary">
      <div className="text-text-secondary text-sm">Loading...</div>
    </div>
  );

  if (!project) return <ProjectSelector />;
  return <EditorScreen />;
}
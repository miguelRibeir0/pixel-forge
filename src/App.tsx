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
    <div className="flex items-center justify-between px-3 py-1 bg-bg-secondary border-b-2 border-border select-none">
      <div className="flex items-center gap-3">
        <span className="text-xl text-accent tracking-widest">[ PIXEL FORGE ]</span>
        <span className="text-lg text-border">|</span>
        <button
          onClick={clearProject}
          className="text-lg text-text-secondary hover:text-text-primary transition-colors"
          title="Switch project"
        >
          {projectName}
        </button>
        {docWidth && docHeight && (
          <span className="text-base text-text-secondary">
            ({docWidth}x{docHeight})
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-base text-text-secondary">ZOOM {displayZoom}x</span>
      </div>
    </div>
  );
}

function StatusBar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const brushSize = useEditorStore(s => s.brushSize);
  const activeColorIndex = useEditorStore(s => s.activeColorIndex);
  const project = useEditorStore(s => s.project);
  const color = project?.palette.colors[activeColorIndex] ?? '#fff';

  return (
    <div className="flex items-center justify-between px-3 py-0.5 bg-bg-secondary border-t-2 border-border select-none">
      <div className="flex items-center gap-4">
        <span className="text-base text-text-secondary">TOOL: <span className="text-accent">{activeTool.toUpperCase()}</span></span>
        <span className="text-base text-text-secondary">BRUSH: <span className="text-accent">{brushSize}</span></span>
        <span className="flex items-center gap-1 text-base text-text-secondary">
          COLOR:
          <span className="inline-block w-3 h-3 border border-border" style={{ backgroundColor: color }} />
        </span>
      </div>
      <span className="text-base text-text-secondary">v0.1.0</span>
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
        <div className="w-52 flex flex-col border-l-2 border-border bg-bg-secondary">
          <ColorPalette />
          <LayerPanel />
        </div>
      </div>
      <Timeline />
      <StatusBar />
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
    <div className="w-full h-full flex items-center justify-center bg-bg-primary bg-dotted">
      <div className="text-accent text-2xl animate-pulse">LOADING...</div>
    </div>
  );

  if (!project) return <ProjectSelector />;
  return <EditorScreen />;
}

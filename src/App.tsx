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
import { exportFrameAsPng } from './export/png';

function EditorHeader() {
  const projectName = useEditorStore(s => s.project?.name);
  const docWidth = useEditorStore(s => s.project?.documents[0]?.width);
  const docHeight = useEditorStore(s => s.project?.documents[0]?.height);
  const zoom = useEditorStore(s => s.canvas.zoom);
  const fitMode = useEditorStore(s => s.canvas.fitMode);
  const clearProject = useEditorStore(s => s.clearProject);
  const displayZoom = fitMode ? zoom.toFixed(1) : zoom;
  const project = useEditorStore(s => s.project);
  const activeDocumentId = useEditorStore(s => s.activeDocumentId);
  const activeFrameId = useEditorStore(s => s.activeFrameId);

  const handleExportPng = () => {
    if (!project || !activeDocumentId || !activeFrameId) return;
    const doc = project.documents.find(d => d.id === activeDocumentId);
    const frame = doc?.frames.find(f => f.id === activeFrameId);
    if (!doc || !frame) return;
    exportFrameAsPng(project, doc, frame);
  };

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-bg-secondary border-b border-border select-none">
      <div className="flex items-center gap-3">
        <span className="text-lg text-accent tracking-widest font-bold opacity-90">PIXEL FORGE</span>
        <span className="text-border-muted text-xs">///</span>
        <button
          onClick={clearProject}
          className="text-lg text-text-secondary hover:text-text-primary transition-colors duration-150"
          title="Switch project"
        >
          {projectName}
        </button>
        {docWidth && docHeight && (
          <span className="text-sm text-text-muted px-2 py-0.5 bg-surface rounded">
            {docWidth}×{docHeight}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleExportPng}
          className="text-xs text-text-muted hover:text-text-primary bg-surface hover:bg-border px-2 py-1 rounded border border-border-subtle transition-colors duration-150"
          title="Export current frame as PNG"
        >
          EXPORT PNG
        </button>
        <span className="text-sm text-text-muted">
          <span className="text-text-secondary">{displayZoom}</span>x
        </span>
      </div>
    </div>
  );
}

function StatusBar() {
  const activeTool = useEditorStore(s => s.activeTool);
  const brushSize = useEditorStore(s => s.brushSize);
  const activeColorIndex = useEditorStore(s => s.activeColorIndex);
  const cursorPixel = useEditorStore(s => s.cursorPixel);
  const project = useEditorStore(s => s.project);
  const color = project?.palette.colors[activeColorIndex] ?? '#fff';

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-bg-secondary border-t border-border select-none text-sm">
      <div className="flex items-center gap-4">
        <span className="text-text-muted">
          <span className="text-text-secondary">{activeTool.toUpperCase()}</span>
        </span>
        <span className="text-border-subtle">|</span>
        <span className="text-text-muted">
          BRUSH <span className="text-text-secondary">{brushSize}</span>
        </span>
        <span className="text-border-subtle">|</span>
        <span className="flex items-center gap-1.5 text-text-muted">
          <span className="inline-block w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: color }} />
          <span className="text-text-secondary">{color}</span>
        </span>
        {cursorPixel && (
          <>
            <span className="text-border-subtle">|</span>
            <span className="text-text-muted">
              <span className="text-text-secondary">{cursorPixel.x},{cursorPixel.y}</span>
            </span>
          </>
        )}
      </div>
      <span className="text-text-muted">v0.1.0</span>
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
        <div className="w-52 flex flex-col border-l border-border bg-bg-secondary">
          <ColorPalette />
          <div className="divider" />
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
      <div className="flex flex-col items-center gap-3">
        <div className="text-accent text-2xl tracking-widest animate-pulse">PIXEL FORGE</div>
        <div className="text-text-muted text-sm">Loading...</div>
      </div>
    </div>
  );

  if (!project) return <ProjectSelector />;
  return <EditorScreen />;
}

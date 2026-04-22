import { useState } from 'react';
import useEditorStore from './store/editorStore';
import PixelCanvas from './ui/PixelCanvas';
import Toolbar from './ui/toolbar/Toolbar';
import ColorPalette from './ui/panels/ColorPalette';
import LayerPanel from './ui/panels/LayerPanel';
import Timeline from './ui/timeline/Timeline';

const SIZES = [16, 32, 64, 128, 256] as const;

function WelcomeScreen() {
  const createProject = useEditorStore(s => s.createProject);
  const [name, setName] = useState('My Project');
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [customSize, setCustomSize] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary">
      <div className="bg-surface rounded-xl p-8 max-w-md w-full shadow-2xl border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          Pixel Forge
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          16-bit pixel art studio for game developers
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors"
              placeholder="My Project"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block mb-1">
              Canvas Size
            </label>
            <div className="flex gap-2 flex-wrap">
              {SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => { setWidth(size); setHeight(size); setCustomSize(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    !customSize && width === size && height === size
                      ? 'bg-accent text-white'
                      : 'bg-bg-primary border border-border text-text-secondary hover:border-text-secondary'
                  }`}
                >
                  {size}×{size}
                </button>
              ))}
              <button
                onClick={() => setCustomSize(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  customSize
                    ? 'bg-accent text-white'
                    : 'bg-bg-primary border border-border text-text-secondary hover:border-text-secondary'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {customSize && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block mb-1">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, Math.min(512, parseInt(e.target.value) || 1)))}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs uppercase tracking-wider text-text-secondary font-semibold block mb-1">Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(1, Math.min(512, parseInt(e.target.value) || 1)))}
                  className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          <button
            onClick={() => createProject(name, width, height)}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold tracking-wide transition-colors shadow-lg shadow-accent/20"
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}

function EditorHeader() {
  const projectName = useEditorStore(s => s.project?.name);
  const docWidth = useEditorStore(s => s.project?.documents[0]?.width);
  const docHeight = useEditorStore(s => s.project?.documents[0]?.height);
  const zoom = useEditorStore(s => s.canvas.zoom);

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-accent tracking-wider">PIXEL FORGE</span>
        <span className="text-xs text-text-secondary">—</span>
        <span className="text-xs text-text-secondary">{projectName}</span>
        {docWidth && docHeight && (
          <span className="text-[10px] text-text-secondary/50">
            ({docWidth}×{docHeight})
          </span>
        )}
      </div>
      <span className="text-[10px] text-text-secondary/50">Zoom: {zoom}x</span>
    </div>
  );
}

function EditorScreen() {
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
  if (!project) return <WelcomeScreen />;
  return <EditorScreen />;
}
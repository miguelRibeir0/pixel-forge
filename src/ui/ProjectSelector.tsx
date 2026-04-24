import { useState, useEffect } from 'react';
import useEditorStore from '../store/editorStore';
import { listProjects, deleteProject, saveProject } from '../storage/indexeddb';
import type { Project } from '../types';

const SIZES = [16, 32, 64, 128, 256] as const;

export default function ProjectSelector() {
  const createProject = useEditorStore(s => s.createProject);
  const setProject = useEditorStore(s => s.setProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('My Project');
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [customSize, setCustomSize] = useState(false);
  const [tab, setTab] = useState<'recent' | 'new'>('recent');

  useEffect(() => {
    listProjects().then(setProjects);
  }, []);

  const handleCreate = () => {
    createProject(name, width, height);
    const proj = useEditorStore.getState().project;
    if (proj) saveProject(proj);
  };

  const handleLoad = (project: Project) => {
    setProject(project);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary">
      <div className="bg-surface rounded-xl p-8 max-w-lg w-full shadow-2xl border border-border">
        <h1 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">
          Pixel Forge
        </h1>
        <p className="text-sm text-text-secondary mb-6">
          16-bit pixel art studio for game developers
        </p>

        <div className="flex gap-1 mb-5">
          <button
            onClick={() => setTab('recent')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'recent'
                ? 'bg-accent text-white'
                : 'bg-bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            Recent Projects
          </button>
          <button
            onClick={() => setTab('new')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'new'
                ? 'bg-accent text-white'
                : 'bg-bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            New Project
          </button>
        </div>

        {tab === 'recent' ? (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-sm text-text-secondary text-center py-8">
                No saved projects yet. Create one to get started.
              </p>
            ) : (
              projects.map(project => {
                const doc = project.documents[0];
                return (
                  <div
                    key={project.id}
                    onClick={() => handleLoad(project)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-primary hover:bg-surface-hover cursor-pointer group transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary font-medium truncate">{project.name}</div>
                      <div className="text-[10px] text-text-secondary/60">
                        {doc ? `${doc.width}×${doc.height}` : '—'} · {formatDate(project.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-400 text-xs px-2 py-1 transition-opacity"
                      title="Delete project"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
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
              onClick={handleCreate}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold tracking-wide transition-colors shadow-lg shadow-accent/20"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
    <div className="w-full h-full flex items-center justify-center bg-bg-primary bg-dotted">
      <div className="inset p-6 max-w-xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-5xl text-accent tracking-widest mb-1">PIXEL FORGE</h1>
          <p className="text-lg text-text-secondary">16-BIT PIXEL ART STUDIO</p>
        </div>

        <div className="flex gap-0 mb-4 border-2 border-border bg-bg-secondary">
          <button
            onClick={() => setTab('recent')}
            className={`flex-1 py-1 text-lg transition-colors border-r-2 border-border ${
              tab === 'recent'
                ? 'bg-accent text-bg-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            &gt; RECENT
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-1 text-lg transition-colors ${
              tab === 'new'
                ? 'bg-accent text-bg-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            &gt; NEW
          </button>
        </div>

        {tab === 'recent' ? (
          <div className="border-2 border-border bg-bg-secondary max-h-72 overflow-y-auto">
            {projects.length === 0 ? (
              <p className="text-lg text-text-secondary text-center py-10">
                NO SAVED PROJECTS. CREATE ONE TO START.
              </p>
            ) : (
              projects.map(project => {
                const doc = project.documents[0];
                return (
                  <div
                    key={project.id}
                    onClick={() => handleLoad(project)}
                    className="flex items-center justify-between px-3 py-2 bg-bg-secondary hover:bg-surface-hover cursor-pointer group transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-lg text-text-primary truncate">&gt; {project.name}</div>
                      <div className="text-base text-text-secondary pl-4">
                        {doc ? `${doc.width}x${doc.height}` : '-'} / {formatDate(project.updatedAt)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-danger text-lg px-2 py-1 transition-opacity border border-transparent hover:border-danger"
                      title="Delete project"
                    >
                      [X]
                    </button>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-lg uppercase tracking-wider text-text-secondary block mb-1">
                PROJECT NAME
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full inset px-3 py-1 text-lg text-text-primary focus:outline-none focus:border-accent"
                placeholder="My Project"
              />
            </div>

            <div>
              <label className="text-lg uppercase tracking-wider text-text-secondary block mb-1">
                CANVAS SIZE
              </label>
              <div className="flex gap-0 flex-wrap border-2 border-border">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => { setWidth(size); setHeight(size); setCustomSize(false); }}
                    className={`flex-1 py-1 text-lg transition-colors border-r-2 border-border last:border-r-0 ${
                      !customSize && width === size && height === size
                        ? 'bg-accent text-bg-primary'
                        : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }`}
                  >
                    {size}x{size}
                  </button>
                ))}
                <button
                  onClick={() => setCustomSize(true)}
                  className={`flex-1 py-1 text-lg transition-colors ${
                    customSize
                      ? 'bg-accent text-bg-primary'
                      : 'bg-bg-secondary text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }`}
                >
                  CUSTOM
                </button>
              </div>
            </div>

            {customSize && (
              <div className="flex gap-0 border-2 border-border">
                <div className="flex-1 border-r-2 border-border">
                  <label className="text-base text-text-secondary uppercase block px-3 pt-1 bg-bg-secondary">WIDTH</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, Math.min(512, parseInt(e.target.value) || 1)))}
                    className="w-full bg-bg-primary px-3 py-1 text-lg text-text-primary focus:outline-none focus:border-accent border-t-2 border-border"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-base text-text-secondary uppercase block px-3 pt-1 bg-bg-secondary">HEIGHT</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Math.min(512, parseInt(e.target.value) || 1)))}
                    className="w-full bg-bg-primary px-3 py-1 text-lg text-text-primary focus:outline-none focus:border-accent border-t-2 border-border"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              className="w-full py-2 bg-accent hover:bg-accent-hover text-bg-primary text-xl tracking-widest transition-colors border-2 border-accent hover:border-accent-hover"
            >
              [ CREATE PROJECT ]
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

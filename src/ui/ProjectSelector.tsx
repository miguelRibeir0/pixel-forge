import { useState, useEffect } from "react";
import useEditorStore from "../store/editorStore";
import { listProjects, deleteProject, saveProject } from "../storage/indexeddb";
import { Trash2 } from "lucide-react";
import type { Project } from "../types";

const SIZES = [16, 32, 64, 128, 256] as const;

export default function ProjectSelector() {
  const createProject = useEditorStore((s) => s.createProject);
  const setProject = useEditorStore((s) => s.setProject);
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("My Project");
  const [width, setWidth] = useState(32);
  const [height, setHeight] = useState(32);
  const [customSize, setCustomSize] = useState(false);
  const [tab, setTab] = useState<"recent" | "new">("recent");

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
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-bg-primary bg-dotted">
      <div className="max-w-lg w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-accent tracking-widest mb-1 font-bold">
            PIXEL FORGE
          </h1>
          <p className="text-sm text-text-muted tracking-wider">
            16-BIT PIXEL ART STUDIO
          </p>
        </div>

        <div className="panel">
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab("recent")}
              className={`flex-1 py-2 text-sm tracking-wider transition-all duration-150 ${
                tab === "recent"
                  ? "text-accent border-b-2 border-accent bg-accent-dim"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              RECENT
            </button>
            <button
              onClick={() => setTab("new")}
              className={`flex-1 py-2 text-sm tracking-wider transition-all duration-150 ${
                tab === "new"
                  ? "text-accent border-b-2 border-accent bg-accent-dim"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              NEW PROJECT
            </button>
          </div>

          {tab === "recent" ? (
            <div className="max-h-72 overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-text-muted text-sm mb-1">
                    No saved projects
                  </p>
                  <p className="text-text-muted/60 text-xs">
                    Create one to get started
                  </p>
                </div>
              ) : (
                projects.map((project) => {
                  const doc = project.documents[0];
                  return (
                    <div
                      key={project.id}
                      onClick={() => handleLoad(project)}
                      className="flex items-center justify-between px-3 py-2.5 hover:bg-surface cursor-pointer group transition-colors border-b border-border-subtle last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-primary truncate">
                          {project.name}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">
                          {doc ? `${doc.width}×${doc.height}` : "—"} ·{" "}
                          {formatDate(project.updatedAt)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all p-1"
                        title="Delete project"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input"
                  placeholder="My Project"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                  Canvas Size
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setWidth(size);
                        setHeight(size);
                        setCustomSize(false);
                      }}
                      className={`py-2 text-xs rounded transition-all duration-150 ${
                        !customSize && width === size && height === size
                          ? "bg-accent text-bg-primary font-bold"
                          : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                  <button
                    onClick={() => setCustomSize(true)}
                    className={`py-2 text-xs rounded transition-all duration-150 ${
                      customSize
                        ? "bg-accent text-bg-primary font-bold"
                        : "bg-surface text-text-secondary hover:bg-surface-hover border border-border"
                    }`}
                  >
                    CUSTOM
                  </button>
                </div>
              </div>

              {customSize && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                      Width
                    </label>
                    <input
                      type="number"
                      value={width}
                      onChange={(e) =>
                        setWidth(
                          Math.max(
                            1,
                            Math.min(512, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-full input"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-text-muted block mb-1.5">
                      Height
                    </label>
                    <input
                      type="number"
                      value={height}
                      onChange={(e) =>
                        setHeight(
                          Math.max(
                            1,
                            Math.min(512, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      className="w-full input"
                    />
                  </div>
                </div>
              )}
              <div className="h-2"></div>
              <button
                onClick={handleCreate}
                className="w-full py-2.5 btn-accent text-sm tracking-widest font-bold rounded"
              >
                CREATE PROJECT
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

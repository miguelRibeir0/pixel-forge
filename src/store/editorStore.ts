import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Project, Frame, Layer, CanvasState, ToolType, Command, PixelDiff, PixelDocument } from '../types';
import { PICO_8 } from '../editor/palette';

interface EditorState {
  project: Project | null;
  activeDocumentId: string | null;
  activeFrameId: string | null;
  activeLayerId: string | null;
  activeColorIndex: number;
  secondaryColorIndex: number;
  activeTool: ToolType;
  brushSize: number;
  canvas: CanvasState;
  undoStack: Command[];
  redoStack: Command[];
  isDrawing: boolean;
  lastPixel: { x: number; y: number } | null;

  setProject: (project: Project) => void;
  createProject: (name: string, width: number, height: number) => void;
  setActiveDocument: (id: string) => void;
  setActiveFrame: (id: string) => void;
  setActiveLayer: (id: string) => void;
  setActiveColorIndex: (index: number) => void;
  setSecondaryColorIndex: (index: number) => void;
  setActiveTool: (tool: ToolType) => void;
  setBrushSize: (size: number) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  toggleGrid: () => void;
  setDrawing: (val: boolean) => void;
  setLastPixel: (pos: { x: number; y: number } | null) => void;

  addLayer: (name?: string) => void;
  removeLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  renameLayer: (layerId: string, name: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  addFrame: () => void;
  removeFrame: (frameId: string) => void;
  duplicateFrame: (frameId: string) => void;
  setFrameDuration: (frameId: string, duration: number) => void;
  setActiveFrameByIndex: (index: number) => void;

  setPixel: (x: number, y: number, colorIndex: number) => void;
  setPixels: (pixels: PixelDiff[]) => void;

  undo: () => void;
  redo: () => void;
  pushCommand: (cmd: Command) => void;
}

function createEmptyLayer(width: number, height: number, name: string = 'Layer 1'): Layer {
  return {
    id: nanoid(),
    name,
    visible: true,
    opacity: 1,
    blendMode: 'source-over',
    pixels: new Uint8Array(width * height),
    locked: false,
  };
}

function createEmptyFrame(width: number, height: number, layerName?: string): Frame {
  return {
    id: nanoid(),
    duration: 100,
    layers: [createEmptyLayer(width, height, layerName || 'Layer 1')],
  };
}

function createEmptyDocument(width: number, height: number): PixelDocument {
  const frame = createEmptyFrame(width, height);
  return {
    id: nanoid(),
    name: 'Untitled',
    type: 'sprite',
    width,
    height,
    frames: [frame],
    tags: [],
  };
}

const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  activeDocumentId: null,
  activeFrameId: null,
  activeLayerId: null,
  activeColorIndex: 1,
  secondaryColorIndex: 0,
  activeTool: 'pencil',
  brushSize: 1,
  canvas: {
    zoom: 8,
    panX: 0,
    panY: 0,
    showGrid: true,
    gridOpacity: 0.15,
  },
  undoStack: [],
  redoStack: [],
  isDrawing: false,
  lastPixel: null,

  setProject: (project) => set({ project }),

  createProject: (name, width, height) => {
    const doc = createEmptyDocument(width, height);
    const project: Project = {
      id: nanoid(),
      name,
      palette: PICO_8,
      documents: [doc],
      activeDocumentId: doc.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({
      project,
      activeDocumentId: doc.id,
      activeFrameId: doc.frames[0].id,
      activeLayerId: doc.frames[0].layers[0].id,
      undoStack: [],
      redoStack: [],
    });
  },

  setActiveDocument: (id) => set({ activeDocumentId: id }),
  setActiveFrame: (id) => {
    const state = get();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    const frame = doc?.frames.find(f => f.id === id);
    if (frame && frame.layers.length > 0) {
      set({ activeFrameId: id, activeLayerId: frame.layers[frame.layers.length - 1].id });
    } else {
      set({ activeFrameId: id, activeLayerId: null });
    }
  },
  setActiveLayer: (id) => set({ activeLayerId: id }),
  setActiveColorIndex: (index) => set({ activeColorIndex: index }),
  setSecondaryColorIndex: (index) => set({ secondaryColorIndex: index }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setBrushSize: (size) => set({ brushSize: size }),
  setZoom: (zoom) => set(s => ({ canvas: { ...s.canvas, zoom: Math.min(3200, Math.max(1, zoom)) } })),
  setPan: (x, y) => set(s => ({ canvas: { ...s.canvas, panX: x, panY: y } })),
  toggleGrid: () => set(s => ({ canvas: { ...s.canvas, showGrid: !s.canvas.showGrid } })),
  setDrawing: (val) => set({ isDrawing: val }),
  setLastPixel: (pos) => set({ lastPixel: pos }),

  addLayer: (name) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const layerNum = frame.layers.length + 1;
    const newLayer = createEmptyLayer(doc.width, doc.height, name || `Layer ${layerNum}`);
    const newFrame = { ...frame, layers: [...frame.layers, newLayer] };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    const newProject = { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() };
    set({ project: newProject, activeLayerId: newLayer.id });
  },

  removeLayer: (layerId) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame || frame.layers.length <= 1) return;
    const newFrame = { ...frame, layers: frame.layers.filter(l => l.id !== layerId) };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    const newProject = { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() };
    const newActiveLayerId = layerId === state.activeLayerId ? newFrame.layers[newFrame.layers.length - 1].id : state.activeLayerId;
    set({ project: newProject, activeLayerId: newActiveLayerId });
  },

  toggleLayerVisibility: (layerId) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const newLayers = frame.layers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l);
    const newFrame = { ...frame, layers: newLayers };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  setLayerOpacity: (layerId, opacity) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const newLayers = frame.layers.map(l => l.id === layerId ? { ...l, opacity } : l);
    const newFrame = { ...frame, layers: newLayers };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  renameLayer: (layerId, name) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const newLayers = frame.layers.map(l => l.id === layerId ? { ...l, name } : l);
    const newFrame = { ...frame, layers: newLayers };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  reorderLayers: (fromIndex, toIndex) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const layers = [...frame.layers];
    const [moved] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, moved);
    const newFrame = { ...frame, layers };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  addFrame: () => {
    const state = get();
    if (!state.project || !state.activeDocumentId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const newFrame = createEmptyFrame(doc.width, doc.height, `Layer 1`);
    const newDoc = { ...doc, frames: [...doc.frames, newFrame] };
    set({
      project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() },
      activeFrameId: newFrame.id,
      activeLayerId: newFrame.layers[0].id,
    });
  },

  removeFrame: (frameId) => {
    const state = get();
    if (!state.project || !state.activeDocumentId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc || doc.frames.length <= 1) return;
    const newDoc = { ...doc, frames: doc.frames.filter(f => f.id !== frameId) };
    const newProject = { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() };
    const newActiveFrameId = frameId === state.activeFrameId ? newDoc.frames[0].id : state.activeFrameId;
    set({ project: newProject, activeFrameId: newActiveFrameId });
  },

  duplicateFrame: (frameId) => {
    const state = get();
    if (!state.project || !state.activeDocumentId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === frameId);
    if (!frame) return;
    const newFrame: Frame = {
      id: nanoid(),
      duration: frame.duration,
      layers: frame.layers.map(l => ({
        ...l,
        id: nanoid(),
        pixels: new Uint8Array(l.pixels),
      })),
    };
    const idx = doc.frames.indexOf(frame);
    const newFrames = [...doc.frames];
    newFrames.splice(idx + 1, 0, newFrame);
    const newDoc = { ...doc, frames: newFrames };
    set({
      project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() },
      activeFrameId: newFrame.id,
    });
  },

  setFrameDuration: (frameId, duration) => {
    const state = get();
    if (!state.project || !state.activeDocumentId) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frameId ? { ...f, duration } : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  setActiveFrameByIndex: (index) => {
    const state = get();
    const doc = state.project?.documents.find(d => d.id === state.activeDocumentId);
    if (!doc || index < 0 || index >= doc.frames.length) return;
    const frame = doc.frames[index];
    set({ activeFrameId: frame.id, activeLayerId: frame.layers.length > 0 ? frame.layers[frame.layers.length - 1].id : null });
  },

  setPixel: (x, y, colorIndex) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId || !state.activeLayerId) return;
    if (x < 0 || y < 0) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    if (x >= doc.width || y >= doc.height) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const layer = frame.layers.find(l => l.id === state.activeLayerId);
    if (!layer || layer.locked) return;
    const idx = y * doc.width + x;
    const oldIndex = layer.pixels[idx];
    if (oldIndex === colorIndex) return;
    const newPixels = new Uint8Array(layer.pixels);
    newPixels[idx] = colorIndex;
    const newLayer = { ...layer, pixels: newPixels };
    const newFrame = { ...frame, layers: frame.layers.map(l => l.id === layer.id ? newLayer : l) };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  setPixels: (pixels) => {
    const state = get();
    if (!state.project || !state.activeDocumentId || !state.activeFrameId || !state.activeLayerId || pixels.length === 0) return;
    const doc = state.project.documents.find(d => d.id === state.activeDocumentId);
    if (!doc) return;
    const frame = doc.frames.find(f => f.id === state.activeFrameId);
    if (!frame) return;
    const layer = frame.layers.find(l => l.id === state.activeLayerId);
    if (!layer || layer.locked) return;
    const newPixels = new Uint8Array(layer.pixels);
    for (const p of pixels) {
      if (p.x >= 0 && p.y >= 0 && p.x < doc.width && p.y < doc.height) {
        newPixels[p.y * doc.width + p.x] = p.newIndex;
      }
    }
    const newLayer = { ...layer, pixels: newPixels };
    const newFrame = { ...frame, layers: frame.layers.map(l => l.id === layer.id ? newLayer : l) };
    const newDoc = { ...doc, frames: doc.frames.map(f => f.id === frame.id ? newFrame : f) };
    set({ project: { ...state.project, documents: state.project.documents.map(d => d.id === doc.id ? newDoc : d), updatedAt: Date.now() } });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return;
    const cmd = state.undoStack[state.undoStack.length - 1];
    const newUndo = state.undoStack.slice(0, -1);
    set({ undoStack: newUndo, redoStack: [...state.redoStack, cmd] });
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return;
    const cmd = state.redoStack[state.redoStack.length - 1];
    const newRedo = state.redoStack.slice(0, -1);
    set({ redoStack: newRedo, undoStack: [...state.undoStack, cmd] });
  },

  pushCommand: (cmd) => set(s => ({ undoStack: [...s.undoStack, cmd], redoStack: [] })),
}));

export default useEditorStore;
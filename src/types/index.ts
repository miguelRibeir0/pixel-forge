export type BlendMode = 'source-over' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten' | 'color-dodge' | 'color-burn' | 'hard-light' | 'soft-light' | 'difference' | 'exclusion' | 'hue' | 'saturation' | 'color' | 'luminosity';

export type ToolType = 'pencil' | 'eraser' | 'bucket' | 'line' | 'rectangle' | 'ellipse' | 'selection' | 'move' | 'eyedropper' | 'dither';

export type DocumentType = 'sprite' | 'tileset' | 'background';

export type PaletteId = string;

export interface Palette {
  id: PaletteId;
  name: string;
  colors: string[];
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  pixels: Uint8Array;
  locked: boolean;
}

export interface Frame {
  id: string;
  duration: number;
  layers: Layer[];
}

export interface AnimationTag {
  name: string;
  from: number;
  to: number;
  loop: boolean;
}

export interface PixelDocument {
  id: string;
  name: string;
  type: DocumentType;
  width: number;
  height: number;
  frames: Frame[];
  tags: AnimationTag[];
  tileSize?: number;
}

export interface Project {
  id: string;
  name: string;
  palette: Palette;
  documents: PixelDocument[];
  activeDocumentId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  gridOpacity: number;
}

export interface PixelDiff {
  x: number;
  y: number;
  oldIndex: number;
  newIndex: number;
}

export interface Command {
  id: string;
  description: string;
  diffs: PixelDiff[];
  layerId: string;
  frameId: string;
}
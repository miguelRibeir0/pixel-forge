import type { Project, PixelDocument, Frame } from '../types';

function getExportScale(width: number, height: number): number {
  const minDim = Math.min(width, height);
  if (minDim <= 32) return 8;
  if (minDim <= 64) return 4;
  if (minDim <= 128) return 2;
  return 1;
}

export function exportFrameAsPng(
  project: Project,
  pixelDoc: PixelDocument,
  frame: Frame
): void {
  const scale = getExportScale(pixelDoc.width, pixelDoc.height);
  const canvas = window.document.createElement('canvas');
  canvas.width = pixelDoc.width * scale;
  canvas.height = pixelDoc.height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const palette = project.palette.colors;

  // Render each pixel as a scale×scale block (nearest-neighbor upscaling)
  for (const layer of frame.layers) {
    if (!layer.visible) continue;
    ctx.globalAlpha = layer.opacity;
    ctx.globalCompositeOperation = layer.blendMode;
    for (let y = 0; y < pixelDoc.height; y++) {
      for (let x = 0; x < pixelDoc.width; x++) {
        const colorIdx = layer.pixels[y * pixelDoc.width + x];
        if (colorIdx === 0) continue;
        ctx.fillStyle = palette[colorIdx] || '#000000';
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  canvas.toBlob((blob: Blob | null) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = `${project.name}-${pixelDoc.name}-frame-${frame.id.slice(0, 6)}.png`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

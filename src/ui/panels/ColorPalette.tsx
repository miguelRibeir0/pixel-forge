import useEditorStore from '../../store/editorStore';

export default function ColorPalette() {
  const project = useEditorStore(s => s.project);
  const activeColorIndex = useEditorStore(s => s.activeColorIndex);
  const secondaryColorIndex = useEditorStore(s => s.secondaryColorIndex);
  const setActiveColorIndex = useEditorStore(s => s.setActiveColorIndex);
  const setSecondaryColorIndex = useEditorStore(s => s.setSecondaryColorIndex);

  if (!project) return null;
  const { colors } = project.palette;

  const handleClick = (index: number, e: React.MouseEvent) => {
    if (e.button === 2 || e.ctrlKey) {
      setSecondaryColorIndex(index);
    } else {
      setActiveColorIndex(index);
    }
  };

  return (
    <div className="bg-bg-secondary select-none">
      <div className="panel-header">
        <span>{project.palette.name}</span>
      </div>
      <div className="p-2">
        <div
          className="grid gap-px rounded overflow-hidden"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(colors.length))}, 1fr)` }}
        >
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={(e) => handleClick(index, e)}
              onContextMenu={(e) => e.preventDefault()}
              className={`aspect-square transition-all duration-100 ${
                  index === activeColorIndex
                  ? 'ring-2 ring-bg-primary ring-inset scale-110 z-10 relative'
                  : index === secondaryColorIndex
                  ? 'ring-2 ring-text-secondary ring-inset'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: colors[activeColorIndex] }} />
            <span className="text-xs text-text-muted">FG</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-sm border border-border" style={{ backgroundColor: colors[secondaryColorIndex] }} />
            <span className="text-xs text-text-muted">BG</span>
          </div>
          <span className="text-xs text-text-muted ml-auto">{colors.length} colors</span>
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-surface border-b border-border p-2">
      <div className="text-[10px] uppercase tracking-wider text-text-secondary mb-2 font-semibold">
        {project.palette.name}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(colors.length))}, 1fr)` }}>
        {colors.map((color, index) => (
          <button
            key={index}
            onClick={(e) => handleClick(index, e)}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-6 h-6 rounded-sm border transition-all ${
              index === activeColorIndex
                ? 'border-white ring-1 ring-accent scale-110 z-10'
                : index === secondaryColorIndex
                ? 'border-white/50 ring-1 ring-white/30'
                : 'border-border/50 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: colors[activeColorIndex] }} />
          <span className="text-[10px] text-text-secondary">FG</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: colors[secondaryColorIndex] }} />
          <span className="text-[10px] text-text-secondary">BG</span>
        </div>
      </div>
    </div>
  );
}
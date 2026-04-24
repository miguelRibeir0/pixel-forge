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
    <div className="bg-bg-secondary border-b-2 border-border select-none">
      <div className="px-2 py-1 border-b-2 border-border bg-bg-tertiary">
        <span className="text-base text-text-secondary uppercase tracking-wider">{project.palette.name}</span>
      </div>
      <div className="p-2">
        <div
          className="grid gap-px border-2 border-border p-px bg-border"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(colors.length))}, 1fr)` }}
        >
          {colors.map((color, index) => (
            <button
              key={index}
              onClick={(e) => handleClick(index, e)}
              onContextMenu={(e) => e.preventDefault()}
              className={`w-7 h-7 transition-all ${
                index === activeColorIndex
                  ? 'outline outline-2 outline-white outline-offset-0 z-10'
                  : index === secondaryColorIndex
                  ? 'outline outline-2 outline-text-secondary outline-offset-0'
                  : ''
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-border" style={{ backgroundColor: colors[activeColorIndex] }} />
            <span className="text-base text-text-secondary">FG</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-text-secondary" style={{ backgroundColor: colors[secondaryColorIndex] }} />
            <span className="text-base text-text-secondary">BG</span>
          </div>
        </div>
      </div>
    </div>
  );
}

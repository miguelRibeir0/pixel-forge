import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-6 rounded-full border border-border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      style={{
        background: isLight ? 'var(--color-surface-hover)' : 'var(--color-surface)',
      }}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full border border-border-light flex items-center justify-center transition-all duration-200"
        style={{
          background: 'var(--color-bg-primary)',
          transform: isLight ? 'translateX(24px)' : 'translateX(0)',
        }}
      >
        {isLight ? (
          <Sun size={11} className="text-warning" />
        ) : (
          <Moon size={11} className="text-accent" />
        )}
      </span>
    </button>
  );
}

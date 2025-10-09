import { darkTheme as t } from './theme';

export default function FabButton({
  onClick,
  title,
  ariaLabel,
  className = 'fab-cta fab-dark',
  children,
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel || title}
      title={title}
      onClick={onClick}
      style={{
        position: 'fixed', right: 18, bottom: 18, zIndex: 1030,
        width: 56, height: 56, borderRadius: 16,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: t.border, cursor: 'pointer', color: t.text900, backgroundColor: t.surface2,
        boxShadow: '0 8px 20px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35)'
      }}
    >
      {children}
    </button>
  );
}

import { darkTheme as t } from './theme';

export default function ActionButton({
  onClick,
  title,
  ariaLabel,
  className = 'action-icon',
  children,
}) {
  return (
    <button
      type="button"
      className={className}
      title={title}
      aria-label={ariaLabel || title}
      onClick={onClick}
      style={{
        width: 48, height: 48, borderRadius: 12,
        border: t.border, background: t.surface2, color: t.text900,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,.4)'
      }}
    >
      {children}
    </button>
  );
}

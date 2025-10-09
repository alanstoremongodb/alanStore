import { darkTheme as t } from './theme';

export default function OutlineButton({ variant = 'secondary', style, className = '', children, ...btn }) {
  const variants = {
    secondary: {
      color: t.text900,
      border: '1px solid rgba(255,255,255,.12)',
      background: 'transparent',
      hoverBg: 'rgba(255,255,255,.06)',
      hoverColor: t.text900,
    },
    warning: {
      color: '#ffd666',
      border: '1px solid rgba(255,214,102,.35)',
      background: 'transparent',
      hoverBg: 'rgba(255,214,102,.12)',
      hoverColor: '#fff',
    },
    danger: {
      color: '#ff7b7b',
      border: '1px solid rgba(255,123,123,.35)',
      background: 'transparent',
      hoverBg: 'rgba(255,123,123,.14)',
      hoverColor: '#fff',
    },
  };
  const v = variants[variant] || variants.secondary;
  return (
    <button
      type="button"
      {...btn}
      className={`btn btn-outline-${variant} ${className}`}
      style={{
        color: v.color, background: v.background, border: v.border, borderRadius: 8,
        padding: '8px 12px', fontWeight: 600,
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = v.hoverBg; e.currentTarget.style.color = v.hoverColor; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = v.background; e.currentTarget.style.color = v.color; }}
    >
      {children}
    </button>
  );
}

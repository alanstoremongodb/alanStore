import { darkTheme as t } from './theme';

export function PillPrimary({ children, className = '', style, ...btn }) {
  return (
    <button
      type="button"
      {...btn}
      className={`pill-cta ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
        borderRadius: 9999, background: t.accent, color: '#fff', border: 0,
        padding: '12px 22px', fontWeight: 700, letterSpacing: '.2px', boxShadow: t.cardRaiseSm,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function PillGhost({ children, className = '', style, ...btn }) {
  return (
    <button
      type="button"
      {...btn}
      className={`pill-ghost ${className}`}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem',
        borderRadius: 9999, background: 'transparent', color: t.text900,
        border: '1px solid rgba(255,255,255,.12)', padding: '12px 22px', fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

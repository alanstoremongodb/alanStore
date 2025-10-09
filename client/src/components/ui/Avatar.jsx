import { darkTheme as t } from './theme';

export default function Avatar({
  children,
  className = '',
  ariaHidden = true,
  size = 18,
}) {
  return (
    <div
      aria-hidden={ariaHidden}
      className={`b-avatar ${className}`}
      style={{
        width: 48, height: 48, borderRadius: 12, background: t.surface2, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        border: t.border, boxShadow: '0 4px 12px rgba(0,0,0,.4)'
      }}
    >
      {typeof children === 'function' ? children({ size }) : children}
    </div>
  );
}

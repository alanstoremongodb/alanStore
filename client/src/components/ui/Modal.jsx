import { useEffect, useRef } from 'react';
import { darkTheme as t } from './theme';

export default function Modal({
  open,
  onClose,
  title,
  children,
  actions,
  size = 'md', // sm | md | lg
  closeOnBackdrop = true,
  closeOnEscape = true,
  ariaLabelledBy,
  ariaDescribedBy,
  className = '',
  style,
  titleAlign = 'start', // 'start' | 'center' | 'end'
}) {
  const overlayRef = useRef(null);
  const titleId = ariaLabelledBy || 'modal-title-' + Math.random().toString(36).slice(2);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  const maxWidth = size === 'sm' ? 420 : size === 'lg' ? 720 : 560;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
      className={className}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,.6)',
        ...style,
      }}
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === overlayRef.current) onClose?.();
      }}
    >
      <div
        className="b-card border-0"
        style={{
          width: 'min(96vw, ' + maxWidth + 'px)',
          borderRadius: t.radius,
          background: t.surface,
          border: t.border,
          boxShadow: t.cardRaise,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="card-body p-3 p-sm-4">
          {title && (
            <h4 id={titleId} className="m-0 fw-semibold text-white mb-3" style={{ letterSpacing: '.2px', textAlign: titleAlign }}>
              {title}
            </h4>
          )}
          <div>
            {children}
          </div>

          {Array.isArray(actions) && actions.length > 0 && (
            <div className="d-flex flex-column gap-2" style={{ marginTop: 30 }}>
              {actions.map((act) => {
                const isGhost = (act.className || '').includes('pill-ghost');
                const baseStyle = {
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: t.border,
                  color: t.text900,
                  background: isGhost ? 'transparent' : t.surface2,
                  boxShadow: isGhost ? 'none' : t.cardRaiseSm,
                  textAlign: 'center',
                  fontWeight: 600,
                };
                return (
                  <button
                    key={act.key || act.label}
                    type="button"
                    className={act.className}
                    onClick={act.onClick}
                    autoFocus={act.autoFocus}
                    disabled={act.disabled}
                    style={{ ...baseStyle, ...(act.style || {}) }}
                  >
                    {act.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

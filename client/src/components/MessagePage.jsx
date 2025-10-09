// client/src/components/MessagePage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessagePage({
  variant = 'info',
  type = 'info',
  title,
  text,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onClose,
  onConfirm,
  backTo
}) {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const icons = { success: '✓', error: '×', warning: '!', info: 'i' };
  const defaultTitles = {
    info:   { success: '¡Listo!', error: 'Ups…', warning: 'Aviso', info: 'Mensaje' },
    confirm:{ success: '¿Confirmar?', error: '¿Confirmar?', warning: '¿Estás seguro?', info: '¿Confirmar?' }
  };

  const heading = title || defaultTitles[variant]?.[type] || 'Mensaje';
  const icon = icons[type] || icons.info;

  const goBack = () =>
    backTo ? nav(backTo, { replace: true, state: { ts: Date.now() } }) : nav(-1);

  const handleClose = () => (typeof onClose === 'function' ? onClose() : goBack());

  const handleConfirm = async () => {
    if (typeof onConfirm === 'function') {
      try { setBusy(true); await onConfirm(); } finally { setBusy(false); }
      return;
    }
    handleClose();
  };

  const getBgColor = () => {
    switch(type) {
      case 'success': return 'bg-success';
      case 'error': return 'bg-danger';
      case 'warning': return 'bg-warning';
      default: return 'bg-info';
    }
  };

  return (
    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
         style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="card shadow" role="dialog" aria-modal="true">
          <div className="card-body p-4 text-center">
            <div className={`${getBgColor()} rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`} 
                 style={{ width: '64px', height: '64px' }}>
              <span className="fs-2 text-white">{icon}</span>
            </div>
            <h5 className="mb-2">{heading}</h5>
            {text && <p className="text-secondary mb-4">{text}</p>}

            {variant === 'confirm' ? (
              <div className="d-grid gap-2">
                <button
                  className={`btn ${destructive ? 'btn-danger' : 'btn-primary'} btn-lg`}
                  onClick={handleConfirm}
                  disabled={busy}
                >
                  {busy ? 'Procesando…' : confirmText}
                </button>
                <button className="btn btn-outline-secondary btn-lg" onClick={handleClose} disabled={busy}>
                  {cancelText}
                </button>
              </div>
            ) : (
              <button className="btn btn-primary btn-lg w-100" onClick={handleClose}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
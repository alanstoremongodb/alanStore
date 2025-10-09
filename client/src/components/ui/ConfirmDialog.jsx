import Modal from './Modal';
import { darkTheme as t } from './theme';
import AnimatedIcon from './AnimatedIcon';

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmClassName = 'pill-cta pill-cta--light',
  cancelClassName = 'pill-ghost pill-ghost--card',
  size = 'md',
  icon = 'warning', // 'success' | 'warning' | 'error' | 'info' | null
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      titleAlign="center"
      size={size}
      actions={[
        { key: 'confirm', label: confirmLabel, className: confirmClassName, onClick: onConfirm, autoFocus: true },
        { key: 'cancel', label: cancelLabel, className: cancelClassName, onClick: onCancel },
      ]}
    >
      <div className="vstack gap-3 align-items-center">
        {icon && (
          <AnimatedIcon type={icon} size={68} strokeWidth={6} />
        )}
        {typeof message === 'string' ? (
          <p className="mb-0 text-center" style={{ lineHeight: 1.25, color: t.text900 }}>{message}</p>
        ) : (
          <div style={{ textAlign: 'center', width: '100%', color: t.text900 }}>{message}</div>
        )}
      </div>
    </Modal>
  );
}

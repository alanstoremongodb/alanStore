import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from './Modal';
import AnimatedIcon from './AnimatedIcon';
import { darkTheme as t } from './theme';

// Field shape:
// { name: string, label?: string,
//   type?: 'text'|'textarea'|'number'|'password'|'select'|'checkbox',
//   placeholder?: string, required?: boolean, autoFocus?: boolean, rows?: number,
//   min?: number, max?: number, step?: number,
//   options?: Array<{ label: string, value: string | number }>, // for select
// }

export default function FormDialog({
  open,
  title,
  fields = [],
  initialValues = {},
  confirmLabel = 'Guardar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  size = 'md',
  icon, // optional: 'plus' | 'success' | 'warning' | 'error' | 'info'
  validate, // optional: (values) => errorMap | string | null
  children,
  hideActions = false,
}) {
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const firstRef = useRef(null);
  // Evitar bucles: si initialValues es un nuevo objeto en cada render, no lo pongas directo en deps.
  // Usamos una firma estable (JSON) para detectar cambios reales.
  const initialKey = useMemo(() => JSON.stringify(initialValues ?? {}), [initialValues]);
  useEffect(() => {
    if (!open) return;
    if (!Array.isArray(fields) || fields.length === 0) return; // si no hay fields, no reseteamos nada
    setValues({ ...(initialValues || {}) });
    setErrors({});
  }, [open, initialKey, fields]);
  useEffect(() => { if (open) setTimeout(() => firstRef.current?.focus(), 0); }, [open]);

  const renderedFields = useMemo(() => fields.map((f, idx) => {
    const type = f.type || 'text';
    const baseRef = idx === 0 || f.autoFocus ? firstRef : undefined;
    const setVal = (val) => setValues((v) => ({ ...v, [f.name]: val }));

    const commonReqProps = f.required ? { required: true, 'aria-required': true, title: 'Obligatorio' } : {};

    const renderInput = () => {
      if (type === 'textarea') {
        return (
          <textarea
            rows={f.rows || 3}
            className="form-control"
            name={f.name}
            value={values[f.name] ?? ''}
            placeholder={f.placeholder}
            onChange={(e) => setVal(e.target.value)}
            style={inputStyle}
            ref={baseRef}
            {...commonReqProps}
          />
        );
      }
      if (type === 'select') {
        return (
          <select
            className="form-select"
            name={f.name}
            value={values[f.name] ?? ''}
            onChange={(e) => setVal(e.target.value)}
            style={{ ...inputStyle, appearance: 'auto' }}
            ref={baseRef}
            {...commonReqProps}
          >
            <option value="">Seleccioná…</option>
            {(f.options || []).map((opt) => (
              <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      }
      if (type === 'checkbox') {
        return (
          <div className="form-check" style={{ paddingLeft: 0 }}>
            <input
              type="checkbox"
              className="form-check-input"
              id={`fd-${f.name}`}
              checked={!!values[f.name]}
              onChange={(e) => setVal(e.target.checked)}
              style={{ cursor: 'pointer' }}
              ref={baseRef}
              {...(f.required ? { 'aria-required': true } : {})}
            />
            {f.label && (
              <label htmlFor={`fd-${f.name}`} className="form-check-label ms-2" style={{ color: t.text900, cursor: 'pointer' }}>
                {f.label}
                {f.required && <span aria-hidden className="ms-1" style={{ color: '#ff7b7b' }}>*</span>}
              </label>
            )}
          </div>
        );
      }
      // default input (text, number, password)
      return (
        <input
          className="form-control"
          type={type}
          name={f.name}
          min={f.min}
          max={f.max}
          step={f.step}
          value={values[f.name] ?? ''}
          placeholder={f.placeholder}
          onChange={(e) => setVal(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
          style={inputStyle}
          ref={baseRef}
          {...commonReqProps}
        />
      );
    };

    return (
      <div key={f.name}>
        {type !== 'checkbox' && f.label && (
          <label className="form-label fw-medium" style={{ color: t.text900 }}>
            {f.label}
            {f.required && <span aria-hidden className="ms-1" style={{ color: '#ff7b7b' }}>*</span>}
          </label>
        )}
        {renderInput()}
        {errors[f.name] && (
          <div className="small" style={{ color: '#ff7b7b', marginTop: 6 }}>{errors[f.name]}</div>
        )}
      </div>
    );
  }), [fields, values, errors]);

  const handleConfirm = async () => {
    // basic required validation
    const nextErrors = {};
    for (const f of fields) {
      if (f.required) {
        const val = values[f.name];
        const empty = (val === undefined || val === null || (typeof val === 'string' && val.trim() === ''));
        if (empty) nextErrors[f.name] = 'Requerido';
      }
    }
    if (validate) {
      const extra = validate(values);
      if (typeof extra === 'string' && extra) {
        // show as generic error
        nextErrors._ = extra;
      } else if (extra && typeof extra === 'object') {
        Object.assign(nextErrors, extra);
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (busy) return;
    try {
      setBusy(true);
      const ret = onConfirm?.(values);
      if (ret && typeof ret.then === 'function') {
        await ret;
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size={size}
    >
      <div
        className="vstack gap-3"
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          paddingLeft: 8,
          paddingRight: 12,
        }}
      >
        {title && (
          <h4 className="m-0 fw-semibold text-white" style={{ letterSpacing: '.2px', textAlign: icon ? 'center' : 'start' }}>
            {title}
          </h4>
        )}

        {icon && (
          <div className="d-flex justify-content-center" aria-hidden>
            <AnimatedIcon type={icon} size={68} strokeWidth={6} />
          </div>
        )}

        {/* Contenido personalizado (útil para formularios complejos) */}
        {children}

        {renderedFields}
        {errors._ && <div className="small" style={{ color: '#ff7b7b' }}>{errors._}</div>}

        {!hideActions && ((Array.isArray(fields) && fields.length > 0) || typeof onConfirm === 'function') && (
          <div className="d-flex flex-column gap-2" style={{ marginTop: 30 }}>
            <button
              type="button"
              className="pill-cta pill-cta--light"
              onClick={handleConfirm}
              autoFocus
              disabled={busy}
              style={actionBtnStyle}
            >
              {busy ? 'Procesando…' : confirmLabel}
            </button>
            <button
              type="button"
              className="pill-ghost pill-ghost--card"
              onClick={onCancel}
              style={{ ...actionBtnStyle, background: 'transparent', boxShadow: 'none' }}
            >
              {cancelLabel}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

const inputStyle = {
  background: t.surface2,
  border: t.border,
  color: t.text900,
  borderRadius: 12,
  padding: '10px 12px',
  outline: 'none',
};

const actionBtnStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: t.border,
  color: t.text900,
  background: t.surface2,
  boxShadow: t.cardRaiseSm,
  textAlign: 'center',
  fontWeight: 600,
};

// Deprecated wrapper: prefer using FormDialog directly for any entity
import FormDialog from './FormDialog';

export default function BarrioFormModal({ open, initial = { nombre: '', observaciones: '' }, title, confirmLabel = 'Guardar', onConfirm, onCancel }) {
  return (
    <FormDialog
      open={open}
      title={title}
      initialValues={initial}
      confirmLabel={confirmLabel}
      onConfirm={(vals) => onConfirm?.({ nombre: (vals.nombre || '').trim(), observaciones: (vals.observaciones || '').trim() })}
      onCancel={onCancel}
      fields={[
        { name: 'nombre', label: 'Nombre', required: true, autoFocus: true },
        { name: 'observaciones', label: 'Observaciones', type: 'textarea', rows: 3 },
      ]}
      validate={(vals) => {
        if (!vals.nombre || !vals.nombre.trim()) return { nombre: 'Requerido' };
        return null;
      }}
    />
  );
}

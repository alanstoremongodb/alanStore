import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { alertSuccess, alertError } from '../lib/dialog';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import Card from '../components/ui/Card';
import OutlineButton from '../components/ui/OutlineButton';
// Nota: evitamos usar PillPrimary aquí para igualar el estilo "light" de FormDialog
import { darkTheme as t } from '../components/ui/theme';

const toYMDLocal = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function MovimientosForm({
  mode = 'create',
  editId = null,
  onCancel,
  onSaved,
  // Nuevos parámetros para atajos
  initialTipo = null,
  initialProducto = null,
  initialComercio = null
}) {
  const [comercios, setComercios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(mode === 'edit');
  const [invalid, setInvalid] = useState({});
  const [form, setForm] = useState({
    tipo: initialTipo || 'venta',
    fecha: toYMDLocal(new Date()),
    comercio: initialComercio || '',
    observaciones: '',
    items: []
  });

  const [addOpen, setAddOpen] = useState(!!initialProducto); // Abre automáticamente si hay producto inicial
  const [editIndex, setEditIndex] = useState(null);
  const [draft, setDraft] = useState({
    producto: initialProducto || '',
    cantidad: 1,
    ventaTotal: '',
    costoTotal: '',
    autoRepo: true,
  });

  const nav = useNavigate();
  const loc = useLocation();
  const submitLock = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([api.get('/comercios'), api.get('/productos')]);
        setComercios(c.data.comercios || []);
        setProductos(p.data.productos || []);
      } catch { /* noop */ }

      if (mode === 'edit' && editId) {
        try {
          const r = await api.get(`/movimientos/${editId}`);
          const m = r.data.movimiento;

          const srcItems = (Array.isArray(m.productos) && m.productos.length)
            ? m.productos
            : (Array.isArray(m.items) ? m.items : []);

          const comercioId = (m.comercio && typeof m.comercio === 'object') ? (m.comercio._id || '') : (m.comercio || '');
          setForm({
            tipo: m.tipo || 'venta',
            fecha: toYMDLocal(new Date(m.fecha)),
            // carga y faltante NO usan comercio; venta/reposición sí
            comercio: (m.tipo === 'carga' || m.tipo === 'faltante') ? '' : comercioId,
            observaciones: m.observaciones || '',
            items: srcItems.map(it => ({
              producto: (it.producto && typeof it.producto === 'object') ? (it.producto._id || '') : (it.producto || ''),
              cantidad: it.cantidad || 1,
              ventaTotal: it.ventaTotal ?? '',
              costoTotal: it.costoTotal ?? '',
            })),
          });
          setBooting(false);
        } catch {
          await alertError('No se pudo cargar el movimiento');
          onCancel?.();
        }
      } else {
        // en create no hay nada que esperar
        setBooting(false);
      }
    })();
    // eslint-disable-next-line
  }, [mode, editId]);

  // Efecto adicional para manejar valores iniciales en modo create
  useEffect(() => {
    if (mode === 'create' && !booting) {

      // Actualizar form con valores iniciales
      if (initialTipo || initialComercio) {
        setForm(prev => ({
          ...prev,
          tipo: initialTipo || prev.tipo,
          comercio: initialComercio || prev.comercio
        }));
      }

      // Actualizar draft y abrir panel si hay producto inicial
      if (initialProducto) {
        setDraft(prev => ({
          ...prev,
          producto: initialProducto
        }));
        setAddOpen(true);
      }
    }
  }, [mode, booting, initialTipo, initialProducto, initialComercio]);

  // Mientras estamos trayendo el movimiento a editar, no renderizamos el form
  if (booting) {
    return <Card>Cargando…</Card>;
  }

  const setF = (f) => (e) => {
    const v = e?.target?.value ?? e;

    // Si cambia el tipo:
    // - limpio items
    // - cierro el panel de agregar ítem
    // - y si el tipo NO usa comercio (carga/faltante) limpio comercio
    if (f === 'tipo') {
      setAddOpen(false);
      setEditIndex(null);
      setForm(prev => ({
        ...prev,
        tipo: v,
        items: [],
        // comercio: (v === 'carga' || v === 'faltante') ? '' : prev.comercio
        comercio: prev.comercio
      }));
      if (invalid.tipo) setInvalid(prev => ({ ...prev, tipo: false }));
      return;
    }

    setForm(prev => ({ ...prev, [f]: v }));
    if (invalid[f]) setInvalid(prev => ({ ...prev, [f]: false }));
  };

  const openAdd = () => {
    setDraft({ producto: '', cantidad: 1, ventaTotal: '', costoTotal: '', autoRepo: true });
    setEditIndex(null);
    setAddOpen(true);
  };
  const openEdit = (i) => {
    const it = form.items[i];
    setDraft({
      producto: it.producto || '',
      cantidad: it.cantidad ?? 1,
      ventaTotal: it.ventaTotal ?? '',
      costoTotal: it.costoTotal ?? '',
      autoRepo: it.autoRepo ?? true,
    });
    setEditIndex(i);
    setAddOpen(true);
  };
  const cancelAdd = () => { setAddOpen(false); setEditIndex(null); };
  const setD = (f) => (e) => {
    const v = e?.target?.value ?? e;
    setDraft(prev => ({ ...prev, [f]: v }));
  };

  const confirmAdd = async () => {
    if (!draft.producto) { await alertError('Elegí un producto.'); return; }
    if (!draft.cantidad || Number(draft.cantidad) <= 0) { await alertError('La cantidad debe ser mayor a cero.'); return; }

    // Solo guardo el campo monetario que corresponde
    let ventaTotal, costoTotal;
    if (form.tipo === 'venta') {
      ventaTotal = draft.ventaTotal === '' ? undefined : Number(draft.ventaTotal);
    }
    if (form.tipo === 'carga') {
      costoTotal = draft.costoTotal === '' ? undefined : Number(draft.costoTotal);
    }

    const nextItem = {
      producto: draft.producto,
      cantidad: Number(draft.cantidad),
      ventaTotal,
      costoTotal,
    };
    if (form.tipo === 'venta') nextItem.autoRepo = !!draft.autoRepo;

    setForm(prev => {
      const items = [...prev.items];
      if (editIndex == null) items.push(nextItem); else items[editIndex] = nextItem;
      return { ...prev, items };
    });

    setAddOpen(false);
    setEditIndex(null);
  };

  const rmItem = (i) => setForm(prev => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const validate = () => {
    const next = {};
    if (!form.tipo) next.tipo = true;
    if (!form.fecha) next.fecha = true;
    // venta y reposicion requieren comercio
    if ((form.tipo === 'venta' || form.tipo === 'reposicion') && !form.comercio) next.comercio = true;

    setInvalid(next);
    if (Object.keys(next).length) {
      alertError('Revisá los campos obligatorios.');
      return false;
    }
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // Guard anti doble submit ultra-rápido
    if (submitLock.current) return;
    submitLock.current = true;
    if (!validate()) return;
    setLoading(true);

    const payload = {
      tipo: form.tipo,
      fecha: form.fecha,
      // envío comercio solo cuando aplica
      comercio: (form.tipo === 'venta' || form.tipo === 'reposicion') ? (form.comercio || undefined) : undefined,
      observaciones: form.observaciones || undefined,
      productos: form.items
        .filter(x => x.producto && x.cantidad)
        .map(x => ({
          producto: x.producto,
          cantidad: Number(x.cantidad),
          // envío solo el monetario que corresponde
          ventaTotal: form.tipo === 'venta'
            ? (x.ventaTotal == null || x.ventaTotal === '' ? undefined : Number(x.ventaTotal))
            : undefined,
          costoTotal: form.tipo === 'carga'
            ? (x.costoTotal == null || x.costoTotal === '' ? undefined : Number(x.costoTotal))
            : undefined,
        }))
    };

    try {
      if (mode === 'edit' && editId) {
        await api.put(`/movimientos/${editId}`, payload);
        await alertSuccess('Movimiento actualizado');
      } else {
        // Crear venta
        const ventaRes = await api.post('/movimientos', payload);

        // Si es venta y hay items marcados para reposición automática, creo un movimiento separado de reposición
        if (form.tipo === 'venta') {
          const itemsRepo = form.items.filter(x => x.producto && x.cantidad && x.autoRepo);
          if (itemsRepo.length) {
            const repoPayload = {
              tipo: 'reposicion',
              fecha: form.fecha,
              comercio: form.comercio || undefined,
              observaciones: 'Reposición automática por venta',
              productos: itemsRepo.map(x => ({ producto: x.producto, cantidad: Number(x.cantidad) })),
            };
            try {
              await api.post('/movimientos', repoPayload);
              await alertSuccess('Venta y reposición creadas');
            } catch (repoErr) {
              await alertError('Venta creada, pero no se pudo crear la reposición automática');
            }
          } else {
            await alertSuccess('Movimiento creado');
          }
        } else {
          await alertSuccess('Movimiento creado');
        }
      }
      onSaved?.();
    } catch (e2) {
      await alertError(e2?.response?.data?.error || 'Error guardando movimiento');
    } finally { setLoading(false); }
    submitLock.current = false;
  };

  const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;

  // Mostrar selector de comercio solo en tipos que lo usan
  const showComercio = (form.tipo === 'venta' || form.tipo === 'reposicion');

  const comercioExiste = form.comercio && comercios.some(c => c._id === form.comercio);

  return (
    <Card>
      <form noValidate onSubmit={onSubmit} className="vstack gap-3">
        <div className="row g-2">
          <div className="col-12 col-md-3">
            <label className="form-label mb-1" style={{ color: t.text900 }}>Tipo <span aria-hidden style={{ color: '#ff7b7b' }}>*</span></label>
            <select
              className={`form-select ${invalid.tipo ? 'is-invalid' : ''}`}
              value={form.tipo}
              onChange={setF('tipo')}
              required
              aria-required
              style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}
            >
              <option value="carga">Carga</option>
              <option value="reposicion">Reposición</option>
              <option value="venta">Venta</option>
              <option value="faltante">Faltante</option>
            </select>
          </div>

          {showComercio && (
            <div className="col-12 col-md-9">
              <label className="form-label mb-1" style={{ color: t.text900 }}>Comercio {showComercio && <span aria-hidden style={{ color: '#ff7b7b' }}>*</span>}</label>
              <select
                className={`form-select ${invalid.comercio ? 'is-invalid' : ''}`}
                value={form.comercio}
                onChange={setF('comercio')}
                required={showComercio}
                aria-required={showComercio || undefined}
                style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}
              >
                <option value="">—</option>
                {!comercioExiste && form.comercio && (
                  <option value={form.comercio}>(comercio no listado)</option>
                )}
                {comercios.map(c => (
                  <option key={c._id} value={c._id}>{c.nombre}</option>
                ))}
              </select>
              {invalid.comercio && <div className="invalid-feedback">Seleccioná un comercio</div>}
            </div>
          )}
        </div>

        {/* Fecha abajo para evitar que se corte en mobile */}
        <div className="row g-2">
          <div className="col-12 col-md-3">
            <label className="form-label mb-1" style={{ color: t.text900 }}>Fecha <span aria-hidden style={{ color: '#ff7b7b' }}>*</span></label>
            <input
              type="date"
              className={`form-control date-icon-white ${invalid.fecha ? 'is-invalid' : ''}`}
              value={form.fecha}
              onChange={setF('fecha')}
              required
              aria-required
              style={{ backgroundColor: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="m-0 text-secondary text-uppercase">Ítems</h6>
            <OutlineButton onClick={openAdd}>Agregar item</OutlineButton>
          </div>

          {addOpen && (
            <div className="border rounded p-2 mb-3">
              <div className="row g-2">
                <div className="col-12 col-md-4">
                  <label className="form-label mb-1" style={{ color: t.text900 }}>Producto <span aria-hidden style={{ color: '#ff7b7b' }}>*</span></label>
                  <select className="form-select" value={draft.producto} onChange={setD('producto')} required aria-required style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}>
                    <option value="">Seleccioná…</option>
                    {productos.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                  </select>
                </div>

                <div className="col-6 col-md-2">
                  <label className="form-label mb-1" style={{ color: t.text900 }}>Cantidad <span aria-hidden style={{ color: '#ff7b7b' }}>*</span></label>
                  <input type="number" min="1" className="form-control" value={draft.cantidad} onChange={setD('cantidad')} required aria-required style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }} />
                </div>

                {/* Campos monetarios por tipo */}
                {form.tipo === 'venta' && (
                  <div className="col-6 col-md-3">
                    <label className="form-label mb-1" style={{ color: t.text900 }}>Venta total</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="form-control"
                      value={draft.ventaTotal}
                      onChange={setD('ventaTotal')}
                      style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                )}

                {form.tipo === 'carga' && (
                  <div className="col-6 col-md-3">
                    <label className="form-label mb-1" style={{ color: t.text900 }}>Costo total</label>
                    <input
                      type="number" step="0.01" min="0"
                      className="form-control"
                      value={draft.costoTotal}
                      onChange={setD('costoTotal')}
                      style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }}
                    />
                  </div>
                )}

                {/* reposición y faltante: solo cantidad */}
              </div>

                <div className="d-flex justify-content-center gap-2 flex-wrap mt-4">
                <OutlineButton variant="warning" onClick={confirmAdd}>
                  {editIndex == null ? 'Confirmar' : 'Modificar'}
                </OutlineButton>
                <OutlineButton variant="secondary" onClick={cancelAdd}>Cancelar</OutlineButton>
              </div>
            </div>
          )}

          {!form.items.length && <div className="text-secondary small">Sin ítems</div>}
          {!!form.items.length && (
            <div className="vstack gap-2">
              {form.items.map((it, i) => {
                const p = productos.find(pp => pp._id === it.producto);
                const nombre = p?.nombre || '';
                const ventaTotal = it.ventaTotal != null && it.ventaTotal !== '' ? fmtMoney(Number(it.ventaTotal)) : '';
                const costoTotal = it.costoTotal != null && it.costoTotal !== '' ? fmtMoney(Number(it.costoTotal)) : '';

                return (
                  <div key={i} className="border rounded p-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <strong>{nombre}</strong>
                      <div className="d-flex gap-2">
                        <OutlineButton variant="warning" title="Editar" onClick={() => openEdit(i)}><FiEdit2 /></OutlineButton>
                        <OutlineButton variant="danger" title="Quitar" onClick={() => rmItem(i)}><FiTrash2 /></OutlineButton>
                      </div>
                    </div>

                    <div className="row g-2 mt-1 small">
                      {/* SIEMPRE: Cantidad */}
                      <div className="col-6 col-md-3">
                        <div className="text-secondary">Cantidad</div>
                        <div>{it.cantidad || ''}</div>
                      </div>

                      {/* VENTA: solo Venta total */}
                      {form.tipo === 'venta' && (
                        <div className="col-6 col-md-3">
                          <div className="text-secondary">Venta total</div>
                          <div>{ventaTotal}</div>
                        </div>
                      )}

                      {/* CARGA: solo Costo total */}
                      {form.tipo === 'carga' && (
                        <div className="col-6 col-md-3">
                          <div className="text-secondary">Costo total</div>
                          <div>{costoTotal}</div>
                        </div>
                      )}

                      {/* REPOSICIÓN / FALTANTE: solo cantidad */}
                    </div>

                    {/* Casillero de reposición automática entre los items agregados (solo ventas) */}
                    {form.tipo === 'venta' && (
                      <div className="row g-2 mt-1">
                        <div className="col-12">
                          <label htmlFor={`auto-repo-${i}`} className="d-inline-flex align-items-center" style={{ gap: 8, color: t.text900, cursor: 'pointer' }}>
                            <input
                              id={`auto-repo-${i}`}
                              type="checkbox"
                              className="form-check-input"
                              checked={!!it.autoRepo}
                              onChange={(e) => setForm(prev => { const items = [...prev.items]; items[i] = { ...items[i], autoRepo: e.target.checked }; return { ...prev, items }; })}
                              style={{ margin: 0, cursor: 'pointer' }}
                            />
                            <span>Reponer automáticamente</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="form-label mb-1" style={{ color: t.text900 }}>Observaciones</label>
          <textarea className="form-control" rows={2} value={form.observaciones} onChange={setF('observaciones')} style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, padding: '10px 12px' }} />
        </div>

        <div className="d-grid gap-2">
          <button
            type="submit"
            disabled={loading}
            className="pill-cta pill-cta--light"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 12,
              border: t.border, color: t.text900, background: t.surface2,
              boxShadow: t.cardRaiseSm, textAlign: 'center', fontWeight: 600,
            }}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Crear movimiento'}
          </button>
          <button
            type="button"
            onClick={() => onCancel?.()}
            className="pill-ghost pill-ghost--card"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 12,
              border: t.border, color: t.text900, background: 'transparent',
              boxShadow: 'none', textAlign: 'center', fontWeight: 600,
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </Card>
  );
}

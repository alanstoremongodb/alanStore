import { useEffect, useRef, useState } from 'react';
import api from '../lib/api';
import { alertSuccess, alertError } from '../lib/dialog';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { HiDevicePhoneMobile } from 'react-icons/hi2';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from '../components/ui/SearchBar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import FabButton from '../components/ui/FabButton';
import FormDialog from '../components/ui/FormDialog';
import ActionButton from '../components/ui/ActionButton';
import { darkTheme as t } from '../components/ui/theme';

const EMPTY = { nombre: '', precioLista: '', descripcion: '' };

export default function Productos() {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState('list'); // legacy fallback (no usado con modal propio)
  const [form, setForm] = useState(EMPTY); // legacy fallback
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  // Modal propio
  const USE_NEW_MODAL = true;
  const [mOpen, setMOpen] = useState(false);
  const [mInitial, setMInitial] = useState(EMPTY);
  const [mTitle, setMTitle] = useState('');
  const [mConfirmLabel, setMConfirmLabel] = useState('Guardar');
  const submitLock = useRef(false);

  const nav = useNavigate();
  const loc = useLocation();

  const load = async () => {
    try {
      const r = await api.get('/productos');
      setRows(r.data.productos || []);
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar productos');
    }
  };
  useEffect(() => { load(); }, []);

  // Permite que ProductoDetalle abra el form con ?edit= & back=
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const editId = params.get('edit');
    if (!editId || !rows.length) return;
    const p = rows.find(x => x._id === editId);
    if (p) goEdit(p);
    // eslint-disable-next-line
  }, [loc.search, rows]);

  const goCreate = () => {
    if (USE_NEW_MODAL) {
      setEditingId(null);
      setMInitial(EMPTY);
      setMTitle('Crear producto');
      setMConfirmLabel('Crear');
      setMOpen(true);
      return;
    }
    setForm(EMPTY); setEditingId(null); setMode('form');
  };
  const goEdit = (p) => {
    if (USE_NEW_MODAL) {
      setEditingId(p._id);
      setMInitial({
        nombre: p.nombre || '',
        precioLista: p.precioLista != null ? Number(p.precioLista) : '',
        descripcion: p.descripcion || '',
      });
      setMTitle('Editar producto');
      setMConfirmLabel('Guardar');
      setMOpen(true);
      return;
    }
    setForm({
      nombre: p.nombre || '',
      precioLista: p.precioLista != null ? String(p.precioLista) : '',
      descripcion: p.descripcion || '',
    });
    setEditingId(p._id);
    setMode('form');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitLock.current) return; // anti doble submit
    submitLock.current = true;
    setLoading(true);
    const payload = {
      nombre: form.nombre,
      precioLista: form.precioLista === '' ? undefined : Number(form.precioLista),
      descripcion: form.descripcion || undefined,
    };
    try {
      if (editingId) {
        await api.put(`/productos/${editingId}`, payload);
        await alertSuccess('Producto actualizado');
        const back = new URLSearchParams(loc.search).get('back');
        if (back) { setForm(EMPTY); setEditingId(null); nav(back, { replace: true }); return; }
      } else {
        await api.post('/productos', payload);
        await alertSuccess('Producto creado');
      }
      setForm(EMPTY); setEditingId(null); setMode('list'); load();
    } catch (e2) {
      await alertError(e2?.response?.data?.error || 'Error guardando producto');
    } finally { setLoading(false); submitLock.current = false; }
  };

  // ===== FORM =====
  if (mode === 'form') {
    return (
      <>
        <h3 className="mb-3 fs-5">{editingId ? 'Editar producto' : 'Crear producto'}</h3>
        <div className="card">
          <div className="card-body">
            <form onSubmit={onSubmit} className="vstack gap-3" noValidate>
              <div>
                <label className="form-label">Nombre</label>
                <input
                  className="form-control"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label">Precio lista</label>
                <input
                  type="number" step="0.01" min="0"
                  className="form-control"
                  value={form.precioLista}
                  onChange={(e) => setForm({ ...form, precioLista: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Descripción</label>
                <textarea
                  className="form-control" rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>
              <div className="d-grid gap-2">
                <button className="btn btn-primary" disabled={loading}>
                  {editingId ? 'Guardar cambios' : 'Crear producto'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    const back = new URLSearchParams(loc.search).get('back');
                    if (back) nav(back, { replace: true });
                    else setMode('list');
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ===== LISTA =====
  const filtered = q.trim()
    ? rows.filter((p) =>
        (p.nombre || '').toLowerCase().includes(q.toLowerCase()) ||
        (p.descripcion || '').toLowerCase().includes(q.toLowerCase())
      )
    : rows;

  // Param para tema iOS opcional (igual que en Barrios)
  const themeParam = new URLSearchParams(loc.search).get('theme') || new URLSearchParams(loc.search).get('ios');
  const isIosDark = typeof themeParam === 'string' && ['1','true','yes','ios','ios-dark','dark'].includes(themeParam.toLowerCase());

  return (
    <div
      className={`productos ${isIosDark ? 'ios-dark' : ''}`}
      style={{
        background: t.bg, color: t.text900, padding: '0 .75rem 16px', boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', position: 'relative'
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Productos</h1>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4 mt-2 mb-4">
          <SearchBar
            value={q}
            onChange={setQ}
            onClear={() => setQ('')}
            placeholder="Buscar producto..."
            icon={<FiSearch size={18} aria-hidden className="search-icon" />}
          />
        </div>
      </div>

      <div className="row g-3">
        {filtered.map((p) => (
          <div key={p._id} className="col-12 col-md-6 col-lg-4">
            <Card>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3 me-2 flex-grow-1" style={{ minWidth: 0 }}>
                  <Avatar>
                    <HiDevicePhoneMobile size={18} />
                  </Avatar>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <h6
                      className="m-0 fw-semibold text-truncate"
                      style={{ letterSpacing: '0.2px', color: t.text900 }}
                      title={p.nombre}
                    >
                      {p.nombre}
                    </h6>
                    {p.precioLista != null && (
                      <div className="small mt-1" style={{ color: t.text900 }}>
                        ${Number(p.precioLista).toLocaleString('es-AR')}
                      </div>
                    )}
                    <p className="small mb-0 mt-1" style={{ color: t.text600 }}>
                      {p.descripcion || 'Sin descripción'}
                    </p>
                  </div>
                </div>
                <ActionButton title="Ver" ariaLabel="Ver producto" onClick={() => nav(`/productos/${p._id}`)}>
                  <FiSearch size={22} />
                </ActionButton>
              </div>
            </Card>
          </div>
        ))}

        {!rows.length && (
          <div className="col-12">
            <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
              <div aria-hidden className="empty-icon"><HiDevicePhoneMobile size={28} /></div>
              <p className="mb-0" style={{ color: t.text600 }}>Sin productos cargados</p>
            </Card>
          </div>
        )}

        {rows.length > 0 && !filtered.length && (
          <div className="col-12">
            <p className="text-center my-3" style={{ color: t.text600 }}>Sin resultados para “{q}”.</p>
          </div>
        )}
      </div>

      <FabButton ariaLabel="Crear producto" title="Crear producto" onClick={goCreate}>
        <FiPlus size={24} />
      </FabButton>

      {USE_NEW_MODAL && (
        <FormDialog
          open={mOpen}
          title={mTitle}
          initialValues={mInitial}
          confirmLabel={mConfirmLabel}
          icon={!editingId ? 'plus' : 'edit'}
          fields={[
            { name: 'nombre', label: 'Nombre', required: true, autoFocus: true },
            { name: 'precioLista', label: 'Precio lista', type: 'number', step: 0.01, min: 0 },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', rows: 3 },
          ]}
          onCancel={() => {
            setMOpen(false);
            const back = new URLSearchParams(loc.search).get('back');
            if (editingId && back) nav(back, { replace: true });
          }}
          onConfirm={async (values) => {
            try {
              const payload = {
                nombre: (values.nombre || '').trim(),
                precioLista: values.precioLista === '' || values.precioLista == null ? undefined : Number(values.precioLista),
                descripcion: (values.descripcion || '').trim() || undefined,
              };
              if (editingId) {
                await api.put(`/productos/${editingId}`, payload);
                await alertSuccess('Producto actualizado');
                const back = new URLSearchParams(loc.search).get('back');
                if (back) {
                  setEditingId(null);
                  setMOpen(false);
                  nav(back, { replace: true });
                  return;
                }
              } else {
                await api.post('/productos', payload);
                await alertSuccess('Producto creado');
              }
              setEditingId(null);
              setMOpen(false);
              await load();
            } catch (e2) {
              await alertError(e2?.response?.data?.error || 'Error guardando producto');
            }
          }}
        />
      )}

    </div>
  );
}

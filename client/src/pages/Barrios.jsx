import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { alertSuccess, alertError } from '../lib/dialog';
import { FiSearch, FiPlus } from 'react-icons/fi';
import { GiVillage } from 'react-icons/gi';
import SearchBar from '../components/ui/SearchBar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import FabButton from '../components/ui/FabButton';
import BarrioFormModal from '../components/ui/BarrioFormModal';
import FormDialog from '../components/ui/FormDialog';
import ActionButton from '../components/ui/ActionButton';
import { darkTheme as t } from '../components/ui/theme';

const EMPTY = { nombre: '', observaciones: '' };
// Color uniforme (morado) para avatares y acentos en Barrios
const AVATAR_COLOR = '#6f42c1';

export default function Barrios() {
  const [rows, setRows] = useState([]);
  const [mode, setMode] = useState('list'); // list | form
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  // Modal propio (flag de activación)
  const USE_NEW_MODAL = true;
  const [mOpen, setMOpen] = useState(false);
  const [mInitial, setMInitial] = useState(EMPTY);
  const [mTitle, setMTitle] = useState('');
  const [mConfirmLabel, setMConfirmLabel] = useState('Guardar');

  const nav = useNavigate();
  const loc = useLocation();
  const themeParam = new URLSearchParams(loc.search).get('theme') || new URLSearchParams(loc.search).get('ios');
  const isIosDark = typeof themeParam === 'string' && ['1','true','yes','ios','ios-dark','dark'].includes(themeParam.toLowerCase());

  const load = async () => {
    try {
      const r = await api.get('/barrios');
      setRows(r.data.barrios || []);
    } catch (e) {
      alertError(e?.response?.data?.error || 'No se pudo cargar barrios');
    }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const editId = params.get('edit');
    if (!editId || !rows.length) return;
    const b = rows.find(x => x._id === editId);
    if (b) goEdit(b);
    // eslint-disable-next-line
  }, [loc.search, rows]);

  // Crear barrio usando SweetAlert2 (fallback al formulario de la página si algo falla)
  const goCreate = async () => {
    if (USE_NEW_MODAL) {
      setEditingId(null);
      setMInitial(EMPTY);
      setMTitle('Crear barrio');
      setMConfirmLabel('Crear');
      setMOpen(true);
      return;
    }
    // Con el modal propio activo, no usamos showBarrioForm
    setForm(EMPTY);
    setEditingId(null);
    setMode('form');
  };

  // Editar barrio usando SweetAlert2 (respeta ?back= y hace fallback al formulario si es necesario)
  const goEdit = async (b) => {
    if (USE_NEW_MODAL) {
      setEditingId(b._id);
      setMInitial({ nombre: b.nombre, observaciones: b.observaciones || '' });
      setMTitle('Editar barrio');
      setMConfirmLabel('Guardar');
      setMOpen(true);
      return;
    }
    // Con el modal propio activo, no usamos showBarrioForm
    const back = new URLSearchParams(loc.search).get('back');
    setForm({ nombre: b.nombre, observaciones: b.observaciones || '' });
    setEditingId(b._id);
    if (back) nav(back, { replace: true }); else setMode('form');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/barrios/${editingId}`, form);
        await alertSuccess('Barrio actualizado');
        const back = new URLSearchParams(loc.search).get('back');
        if (back) {
          setForm(EMPTY);
          setEditingId(null);
          nav(back, { replace: true });
          return;
        }
      } else {
        await api.post('/barrios', form);
        await alertSuccess('Barrio creado');
      }
      setForm(EMPTY);
      setEditingId(null);
      setMode('list');
      load();
    } catch (e2) {
      await alertError(e2?.response?.data?.error || 'Error guardando barrio');
    } finally {
      setLoading(false);
    }
  };

  const filtered = q.trim()
    ? rows.filter((b) =>
        (b.nombre || '').toLowerCase().includes(q.toLowerCase()) ||
        (b.observaciones || '').toLowerCase().includes(q.toLowerCase())
      )
    : rows;

  // ===== FORM =====
  if (mode === 'form') {
    return (
      <div className={`barrios ${isIosDark ? 'ios-dark' : ''}`}>
        <div className="b-card border-0 mx-auto" style={{ maxWidth: 600 }}>
          <div className="card-body p-3 p-sm-4">
            <h4 className="m-0 fw-semibold text-white mb-3" style={{ letterSpacing: '.2px' }}>
              {editingId ? 'Editar barrio' : 'Crear barrio'}
            </h4>
            <form onSubmit={onSubmit} className="vstack gap-3">
              <div>
                <label className="form-label fw-medium text-white">Nombre</label>
                <input
                  className="form-control neu-control neu-control--card"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="form-label fw-medium text-white">Observaciones</label>
                <textarea
                  className="form-control neu-control neu-control--card"
                  rows={3}
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                />
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                <button
                  type="submit"
                  className="pill-cta pill-cta--light flex-fill"
                  disabled={loading}
                >
                  {editingId ? 'Guardar cambios' : 'Crear barrio'}
                </button>
                <button
                  type="button"
                  className="pill-ghost pill-ghost--card flex-fill"
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
      </div>
    );
  }

  // ===== LISTA =====
  return (
    <div
      className={`barrios ${isIosDark ? 'ios-dark' : ''}`}
      style={{
        background: t.bg, color: t.text900, minHeight: '100dvh', padding: '0 .75rem 16px', boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', position: 'relative'
      }}
    >
      {/* Fondo fijo para cubrir todo el viewport y evitar bandas blancas */}
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />
      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Barrios</h1>
        </div>
      </div>
      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4 mt-2 mb-4">
          <SearchBar
            value={q}
            onChange={setQ}
            onClear={() => setQ('')}
            placeholder="Buscar barrio..."
            icon={<FiSearch size={18} aria-hidden className="search-icon" />}
          />
        </div>
      </div>
      {/* <hr className="soft-sep mb-3" /> */}
      <div className="row g-3">
        {filtered.map((b) => (
          <div key={b._id} className="col-12 col-md-6 col-lg-4">
            <Card>
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3 me-2 flex-grow-1" style={{ minWidth: 0 }}>
                  <Avatar>
                    <GiVillage size={18} />
                  </Avatar>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <h6
                      className="m-0 fw-semibold text-truncate"
                      style={{ letterSpacing: '0.2px', color: t.text900 }}
                      title={b.nombre}
                    >
                      {b.nombre}
                    </h6>
                    <p
                      className="small mb-0 mt-1"
                      style={{ minHeight: 24, color: t.text600 }}
                    >
                      {b.observaciones && b.observaciones.trim()
                        ? b.observaciones
                        : 'Sin observaciones'}
                    </p>
                  </div>
                </div>
                <ActionButton title="Ver" ariaLabel="Ver barrio" onClick={() => nav(`/barrios/${b._id}`)}>
                  <FiSearch size={22} />
                </ActionButton>
              </div>
            </Card>
          </div>
        ))}

        {!rows.length && (
          <div className="col-12">
            <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
                <div aria-hidden className="empty-icon"><GiVillage size={28} /></div>
                <p className="mb-0" style={{ color: t.text600 }}>Sin barrios cargados</p>
            </Card>
          </div>
        )}

        {rows.length > 0 && !filtered.length && (
          <div className="col-12">
            <p className="text-center my-3" style={{ color: t.text600 }}>Sin resultados para “{q}”.</p>
          </div>
        )}
      </div>

      {/* Botón flotante para crear barrio */}
      <FabButton ariaLabel="Crear barrio" title="Crear barrio" onClick={goCreate}>
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
            { name: 'observaciones', label: 'Observaciones', type: 'textarea', rows: 3 },
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
                observaciones: (values.observaciones || '').trim(),
              };
              if (editingId) {
                await api.put(`/barrios/${editingId}`, payload);
                await alertSuccess('Barrio actualizado');
                const back = new URLSearchParams(loc.search).get('back');
                if (back) {
                  setEditingId(null);
                  setMOpen(false);
                  nav(back, { replace: true });
                  return;
                }
              } else {
                await api.post('/barrios', payload);
                await alertSuccess('Barrio creado');
              }
              setEditingId(null);
              setMOpen(false);
              await load();
            } catch (e2) {
              await alertError(e2?.response?.data?.error || 'Error guardando barrio');
            }
          }}
        />
      )}

    </div>
  );
}

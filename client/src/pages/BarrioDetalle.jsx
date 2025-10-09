import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { alertSuccess, alertError, confirmDanger } from '../lib/dialog';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Card from '../components/ui/Card';
import OutlineButton from '../components/ui/OutlineButton';
import { darkTheme as t } from '../components/ui/theme';
import ActionButton from '../components/ui/ActionButton';
import StockTable from '../components/ui/StockTable';

export default function BarrioDetalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const [barrio, setBarrio] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [comercios, setComercios] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [b, inv, cs] = await Promise.all([
        api.get(`/barrios/${id}`),
        api.get('/inventario'),
        api.get('/comercios')
      ]);
      setBarrio(b.data.barrio || null);
      setInventario(inv.data.inventario || []);
      setComercios((cs.data.comercios || []).filter(c => c.barrio?._id === id));
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar el barrio');
      const fallback = '/barrios';
      const from = loc.state?.from || fallback;
      nav(from, { replace: true });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const stockBarrio = useMemo(() => {
    const rows = inventario.filter(r => r.comercio?.barrio?._id === id);
    const map = new Map();
    for (const r of rows) {
      const pid = r.producto._id;
      const prev = map.get(pid) || { producto: r.producto, cantidad: 0 };
      prev.cantidad += r.cantidad;
      map.set(pid, prev);
    }
    return Array.from(map.values()).sort((a, b) => a.producto.nombre.localeCompare(b.producto.nombre));
  }, [inventario, id]);

  const handleEditar = () => nav(`/barrios?edit=${id}&back=/barrios/${id}`);
  const handleEliminar = async () => {
    const ok = await confirmDanger(`¿Eliminar barrio "${barrio?.nombre}"?`);
    if (!ok) return;
    try {
      await api.delete(`/barrios/${id}`);
      await alertSuccess('Barrio eliminado');
      nav('/barrios', { replace: true });
    } catch (e) { await alertError(e?.response?.data?.error || 'Error eliminando barrio'); }
  };

  if (loading) return <div className="py-4" style={{ background: t.bg, color: t.text900, minHeight: '100dvh' }}>Cargando…</div>;
  if (!barrio) return null;

  return (
    <div
      style={{
        background: t.bg,
        color: t.text900,
        padding: '0 .75rem 16px',
        boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)',
        marginRight: 'calc(-50vw + 50%)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="d-flex flex-column align-items-center mb-3">
        <h3 className="text-center mb-3" style={{ color: t.text900 }}>
          {barrio.nombre}
        </h3>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <ActionButton aria-label="Editar barrio" title="Editar" onClick={handleEditar}>
            <FiEdit2 size={18} />
          </ActionButton>
          <ActionButton aria-label="Eliminar barrio" title="Eliminar" onClick={handleEliminar}>
            <FiTrash2 size={18} />
          </ActionButton>
        </div>
      </div>


      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600 }}>Observaciones</h6>
        <div className="small" style={{ color: t.text900 }}>{barrio.observaciones || '-'}</div>
      </Card>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600 }}>Comercios en este barrio</h6>
        {comercios.length ? (
          <ul className="mb-0" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', rowGap: 6 }}>
            {comercios.map(c => (
              <li key={c._id}>
                <a
                  href={`/comercios/${c._id}`}
                  style={{ color: t.text900, textDecoration: 'none' }}
                >
                  {c.nombre}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-secondary small" style={{ color: t.text600 }}>Sin comercios en este barrio</div>
        )}
      </Card>

      <Card>
        <h6 className="mb-2" style={{ color: t.text600 }}>Stock total del barrio</h6>
        {stockBarrio.length ? (
          <StockTable rows={stockBarrio} />
        ) : (
          <div className="text-secondary small" style={{ color: t.text600 }}>Sin stock</div>
        )}
      </Card>

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <OutlineButton
          variant="secondary"
          onClick={() => {
            const fallback = '/barrios';
            const from = loc.state?.from || fallback;
            if (typeof from === 'string') return nav(from, { replace: true });
            return nav(from);
          }}
          style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}
        >
          <FiArrowLeft className="me-2" /> Volver
        </OutlineButton>
      </div>
    </div>
  );
}

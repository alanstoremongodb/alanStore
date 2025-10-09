import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { alertError, alertSuccess, confirmDanger } from '../lib/dialog';
import { FiArrowLeft, FiEdit2, FiTrash2, FiMapPin, FiPlusCircle, FiRepeat, FiDollarSign, FiXCircle } from 'react-icons/fi';
import Card from '../components/ui/Card';
import ActionButton from '../components/ui/ActionButton';
import OutlineButton from '../components/ui/OutlineButton';
import { darkTheme as t } from '../components/ui/theme';

// Helpers de color por tipo
const typeColor = (tipo) => {
  switch (tipo) {
    case 'carga': return '#3b82f6';       // azul
    case 'reposicion': return '#f59e0b';  // amarillo
    case 'venta': return '#22c55e';       // verde
    case 'faltante': return '#ef4444';    // rojo
    default: return '#64748b';            // slate como fallback
  }
};
const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};
const withAlpha = (hex, a) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

const typeMeta = (tipo) => {
  switch (tipo) {
    case 'carga': return { label: 'Carga', Icon: FiPlusCircle };
    case 'reposicion': return { label: 'Reposición', Icon: FiRepeat };
    case 'venta': return { label: 'Venta', Icon: FiDollarSign };
    case 'faltante': return { label: 'Faltante', Icon: FiXCircle };
    default: return { label: tipo || '', Icon: FiPlusCircle };
  }
};
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;
const sumVenta = (m) =>
  Array.isArray(m.productos) && m.productos.length
    ? m.productos.reduce((acc, it) => acc + (it.ventaTotal || 0), 0)
    : (m.ventaTotal || 0);
const sumCosto = (m) =>
  Array.isArray(m.productos) && m.productos.length
    ? m.productos.reduce((acc, it) => acc + (it.costoTotal || 0), 0)
    : (m.costoTotal || 0);
const movimientoImporte = (m) => {
  if (m.tipo === 'venta') return +sumVenta(m);
  if (m.tipo === 'reposicion' || m.tipo === 'faltante') return -sumCosto(m);
  if (m.tipo === 'carga') { const c = sumCosto(m); return c ? -c : 0; }
  return (sumVenta(m) - sumCosto(m));
};

export default function MovimientoDetalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [mapProd, setMapProd] = useState(() => new Map());
  const [comercios, setComercios] = useState([]);
  const [mapComercio, setMapComercio] = useState(() => new Map());
  const [mapBarrio, setMapBarrio] = useState(() => new Map());

  const load = async () => {
    try {
      const [rm, rp, rc, rb] = await Promise.all([
        api.get(`/movimientos/${id}`),
        api.get('/productos'),
        api.get('/comercios'),
        api.get('/barrios'),
      ]);
      setM(rm.data.movimiento || null);
      // Catálogo de productos para resolver nombres si no viene populado
      const listP = rp.data.productos || [];
      setProductos(listP);
      setMapProd(new Map(listP.map(p => [p._id, p.nombre])));
      // Catálogos de comercios y barrios para resolver nombres
      const listC = rc.data.comercios || [];
      const listB = rb.data.barrios || [];
      setComercios(listC);
      setMapComercio(new Map(listC.map(c => [c._id, c])));
      setMapBarrio(new Map(listB.map(b => [b._id, b.nombre])));
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar el movimiento');
      nav('/movimientos', { replace: true });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const importe = useMemo(() => m ? movimientoImporte(m) : 0, [m]);
  const importeClass = importe >= 0 ? 'text-success' : 'text-danger';

  // Resolver comercio y barrio aunque vengan como IDs (debe estar antes de cualquier return condicional)
  const comercioObj = useMemo(() => {
    if (!m) return null;
    if (m.comercio && typeof m.comercio === 'object') return m.comercio;
    if (typeof m?.comercio === 'string' && mapComercio.has(m.comercio)) return mapComercio.get(m.comercio);
    return null;
  }, [m, mapComercio]);
  const comercioNombre = comercioObj?.nombre || '';
  const barrioNombre = useMemo(() => {
    const b = comercioObj?.barrio;
    if (!b) return '';
    if (typeof b === 'object' && b?.nombre) return b.nombre;
    if (typeof b === 'string' && mapBarrio.has(b)) return mapBarrio.get(b) || '';
    return '';
  }, [comercioObj, mapBarrio]);

  const goBack = () => {
    // Permite volver al origen si vino seteado via location.state.from, si no, respeta filtros actuales de /movimientos
    const from = loc.state?.from;
    if (from) {
      if (typeof from === 'string') return nav(from, { replace: true });
      return nav(from);
    }
    const p = new URLSearchParams(loc.search);
    nav({ pathname: '/movimientos', search: `?${p.toString()}` }, { replace: true });
  };
  const goEdit = () => {
    const p = new URLSearchParams(loc.search);
    p.set('mode', 'edit'); p.set('edit', id);
    if (m?.fecha) p.set('date', new Date(m.fecha).toISOString().slice(0, 10));
    nav({ pathname: '/movimientos', search: `?${p.toString()}` });
  };
  const doDelete = async () => {
    const ok = await confirmDanger('¿Eliminar este movimiento?');
    if (!ok) return;
    try {
      await api.delete(`/movimientos/${id}`);
      await alertSuccess('Movimiento eliminado');
      goBack();
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo eliminar');
    }
  };

  if (loading) return <div className="py-4" style={{ background: t.bg, color: t.text900 }}>Cargando…</div>;
  if (!m) return null;

  // 👇 tolerante: usa m.productos o m.items (según como venga del backend)
  const items = Array.isArray(m.productos) && m.productos.length
    ? m.productos
    : (Array.isArray(m.items) ? m.items : []);

  const nombreProducto = (it) => {
    // 1) si viene populado
    if (it?.producto && typeof it.producto === 'object' && it.producto.nombre) {
      return it.producto.nombre;
    }
    // 2) si viene como ObjectId (string)
    const id = typeof it?.producto === 'string' ? it.producto : it?.producto?._id;
    if (id && mapProd.has(id)) return mapProd.get(id);
    // 3) fallback
    return '';
  };

  const meta = typeMeta(m.tipo);
  const accent = typeColor(m.tipo);
  const cardTint = {
    border: `1px solid ${withAlpha(accent, 0.35)}`,
    background: `linear-gradient(0deg, ${withAlpha(accent, 0.08)}, ${withAlpha(accent, 0.08)}), ${t.surface}`,
    boxShadow: `${withAlpha(accent, 0.12)} 0px 6px 16px, ${t.cardRaiseSm}`,
  };

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
        <h3 className="text-center mb-2" style={{ color: t.text900 }}>
          <meta.Icon size={20} className="me-2" />{meta.label}
        </h3>
        <div className="fw-semibold mb-2" style={{ color: importe >= 0 ? '#4ade80' : '#f87171' }}>
          {importe ? fmtMoney(importe) : ''}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionButton aria-label="Editar" title="Editar" onClick={goEdit}>
            <FiEdit2 size={18} />
          </ActionButton>
          <ActionButton aria-label="Eliminar" title="Eliminar" onClick={doDelete}>
            <FiTrash2 size={18} />
          </ActionButton>
        </div>
      </div>

      <Card className="mb-3" style={cardTint}>
        <h6 className="mb-2" style={{ color: t.text600 }}>Datos</h6>
        <div className="row g-2 small">
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Fecha</div>
            <div style={{ color: t.text900 }}>{new Date(m.fecha).toLocaleDateString('es-AR')}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Comercio</div>
            <div className="text-truncate" title={comercioNombre} style={{ color: t.text900 }}>{comercioNombre || '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Barrio</div>
            <div className="text-truncate" title={barrioNombre || ''} style={{ color: t.text900 }}>
              {barrioNombre || '-'}
            </div>
          </div>
          <div className="col-12">
            <div className="text-secondary" style={{ color: t.text600 }}>Observaciones</div>
            <div style={{ color: t.text900 }}>{m.observaciones || ''}</div>
          </div>
        </div>
      </Card>

      {items.length > 0 && (
        <Card className="mb-3" style={cardTint}>
          <h6 className="mb-2" style={{ color: t.text600 }}>Ítems</h6>
          <ul className="list-group list-group-flush" style={{ background: 'transparent' }}>
            {items.map((it, idx) => {
              const nombre = nombreProducto(it);
              const cant = it.cantidad ?? '';
              const venta = it.ventaTotal != null ? `$${Number(it.ventaTotal).toLocaleString('es-AR')}` : '';
              const costo = it.costoTotal != null ? `$${Number(it.costoTotal).toLocaleString('es-AR')}` : '';
              return (
                <li key={it.producto?._id || it.producto || idx} className="list-group-item px-0" style={{ background: 'transparent', color: t.text900, borderColor: 'rgba(255,255,255,.08)' }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-truncate" title={typeof nombre === 'string' ? nombre : ''}>{nombre}</span>
                    <span style={{ color: t.text600 }}>x{cant}</span>
                  </div>
                  {(venta || costo) && (
                    <div className="small mt-1" style={{ color: t.text600 }}>
                      {venta && <span className="me-3" style={{ color: '#4ade80' }}>Venta {venta}</span>}
                      {costo && <span style={{ color: '#f87171' }}>Costo {costo}</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <OutlineButton
          variant="secondary"
          onClick={goBack}
          style={{ background: t.surface2, border: t.border, color: t.text900, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,.4)' }}
        >
          <FiArrowLeft className="me-2" /> Volver
        </OutlineButton>
      </div>
    </div>
  );
}

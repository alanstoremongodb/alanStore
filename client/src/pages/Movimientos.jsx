import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import {
  FiRepeat, FiDollarSign, FiXCircle, FiPlusCircle,
  FiMapPin, FiChevronLeft, FiChevronRight, FiPlus, FiSearch,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import MovimientosForm from './MovimientosForm.jsx';
import Card from '../components/ui/Card';
import ActionButton from '../components/ui/ActionButton';
import FabButton from '../components/ui/FabButton';
import FormDialog from '../components/ui/FormDialog';
import { darkTheme as t } from '../components/ui/theme';

const toYMDLocal = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const parseYMDLocal = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDaysYMD = (s, delta) => toYMDLocal(new Date(parseYMDLocal(s).getTime() + delta * 86400000));

const typeMeta = (tipo) => {
  switch (tipo) {
    case 'carga': return { label: 'Carga', Icon: FiPlusCircle };
    case 'reposicion': return { label: 'Reposición', Icon: FiRepeat };
    case 'venta': return { label: 'Venta', Icon: FiDollarSign };
    case 'faltante': return { label: 'Faltante', Icon: FiXCircle };
    default: return { label: tipo || '', Icon: FiPlusCircle };
  }
};

// Colores por tipo para tintar Cards
const typeColor = (tipo) => {
  switch (tipo) {
    case 'carga': return '#3b82f6';       // azul
    case 'reposicion': return '#f59e0b';  // amarillo
    case 'venta': return '#22c55e';       // verde
    case 'faltante': return '#ef4444';    // rojo
    default: return '#64748b';            // slate fallback
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
const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;
const sumVenta = (m) => Array.isArray(m.productos) && m.productos.length
  ? m.productos.reduce((a, it) => a + (Number(it.ventaTotal) || 0), 0)
  : (Number(m.ventaTotal) || 0);
const sumCosto = (m) => Array.isArray(m.productos) && m.productos.length
  ? m.productos.reduce((a, it) => a + (Number(it.costoTotal) || 0), 0)
  : (Number(m.costoTotal) || 0);
const movimientoImporte = (m) => {
  if (m.tipo === 'venta') return +sumVenta(m);
  if (m.tipo === 'reposicion' || m.tipo === 'faltante') return -sumCosto(m);
  if (m.tipo === 'carga') { const c = sumCosto(m); return c ? -c : 0; }
  return sumVenta(m) - sumCosto(m);
};

export default function Movimientos() {
  const nav = useNavigate();
  const loc = useLocation();

  const params = new URLSearchParams(loc.search);
  const modeParam = params.get('mode');
  const editId = params.get('edit');
  const urlDate = params.get('date');

  // 👇 NUEVO: prefill
  const typeParam = params.get('type');       // venta | reposicion | carga | faltante
  const comercioParam = params.get('comercio');
  const productParam = params.get('product');

  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => urlDate || toYMDLocal(new Date()));

  useEffect(() => { if (urlDate && urlDate !== selectedDate) setSelectedDate(urlDate); /*eslint-disable-next-line*/ }, [urlDate]);

  const load = async () => {
    try {
      const r = await api.get('/movimientos');
      setRows(r.data.movimientos || []); setErr('');
    } catch (e) { setErr(e?.response?.data?.error || 'No se pudo cargar'); }
  };
  useEffect(() => { load(); }, []);

  const rowsDelDia = useMemo(() => rows.filter(r => toYMDLocal(new Date(r.fecha)) === selectedDate), [rows, selectedDate]);

  const syncDateInUrl = (dateStr, replace = true) => {
    const p = new URLSearchParams(loc.search);
    if (dateStr) p.set('date', dateStr); else p.delete('date');
    nav({ pathname: '/movimientos', search: `?${p.toString()}` }, { replace });
  };
  const setDateAndSync = (d) => { setSelectedDate(d); syncDateInUrl(d); };
  const shiftDay = (delta) => setDateAndSync(addDaysYMD(selectedDate, delta));

  const openCreate = () => {
    const p = new URLSearchParams(loc.search);
    p.set('mode', 'create'); p.delete('edit'); p.set('date', selectedDate);
    nav({ pathname: '/movimientos', search: `?${p.toString()}` });
  };
  const leaveForm = () => {
    const p = new URLSearchParams(loc.search);
    p.delete('mode'); p.delete('edit');
    nav({ pathname: '/movimientos', search: `?${p.toString()}` }, { replace: true });
  };

  const formOpen = (modeParam === 'create' || (modeParam === 'edit' && editId));

  return (
    <div
      className="movimientos"
      style={{
        background: t.bg, color: t.text900, padding: '0 .75rem 16px', boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', position: 'relative'
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Movimientos</h1>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
        <ActionButton title="Día anterior" onClick={() => shiftDay(-1)} ariaLabel="Día anterior"><FiChevronLeft size={20} /></ActionButton>
        <input
          type="date"
          className="text-center date-icon-white"
          style={{
            maxWidth: 220,
            backgroundColor: t.surface2,
            border: t.border,
            color: t.text900,
            borderRadius: 12,
            padding: '10px 12px',
            outline: 'none',
          }}
          value={selectedDate}
          onChange={(e) => setDateAndSync(e.target.value)}
          title="Elegir fecha"
        />
        <ActionButton title="Día siguiente" onClick={() => shiftDay(1)} ariaLabel="Día siguiente"><FiChevronRight size={20} /></ActionButton>
      </div>

      {!rowsDelDia.length && !err && (
        <Card><div className="small" style={{ color: t.text600 }}>Sin movimientos para este día</div></Card>
      )}
      {err && <Card><div className="small" style={{ color: '#ff7b7b' }}>{err}</div></Card>}

      <div className="vstack gap-2">
        {rowsDelDia.map((m) => {
          const meta = typeMeta(m.tipo);
          const importe = movimientoImporte(m);
          const esIngreso = importe >= 0;

          const accent = typeColor(m.tipo);
          const cardTint = {
            border: `1px solid ${withAlpha(accent, 0.28)}`,
            background: `linear-gradient(0deg, ${withAlpha(accent, 0.2)}, ${withAlpha(accent, 0.10)}), ${t.surface}`,
            boxShadow: `${withAlpha(accent, 0.10)} 0px 6px 16px, ${t.cardRaiseSm}`,
          };
          return (
            <Card key={m._id} style={cardTint}>
              <div className="d-flex align-items-stretch justify-content-between" >
                <div className="me-3" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <div className="mb-2 d-flex align-items-center" style={{ color: t.text900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.2px' }}>
                    <meta.Icon size={14} style={{ marginRight: 6, color: t.text900 }} />
                    <span>{meta.label}</span>
                  </div>
                  <div className="fw-semibold" style={{ color: esIngreso ? '#4ade80' : '#f87171' }}>
                    {importe ? fmtMoney(importe) : ''}
                  </div>
                  {m.tipo !== 'carga' && m.comercio?.nombre && (
                    <small className="d-block mt-1" style={{ color: t.text600 }}>
                      <FiMapPin className="me-1" />
                      {m.comercio.nombre}{m.comercio?.barrio?.nombre ? ` · ${m.comercio.barrio.nombre}` : ''}
                    </small>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ActionButton title="Ver" ariaLabel="Ver movimiento" onClick={() => nav(`/movimientos/${m._id}${loc.search || ''}`)}>
                    <FiSearch size={22} />
                  </ActionButton>
                </div>
              </div>

              {Array.isArray(m.productos) && m.productos.length > 0 && (
                <ul className="list-group list-group-flush mt-3" style={{ background: 'transparent' }}>
                  {m.productos.map((it, idx) => (
                    <li key={it.producto?._id || idx} className="list-group-item px-0" style={{ background: 'transparent', color: t.text900, borderColor: 'rgba(255,255,255,.08)' }}>
                      <div className="d-flex justify-content-between">
                        <span>{it.producto?.nombre || ''}</span>
                        <span style={{ color: t.text600 }}>x{it.cantidad}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {m.observaciones && (
                <p className="small mt-3 mb-0" style={{ color: t.text600 }}>{m.observaciones}</p>
              )}
            </Card>
          );
        })}
      </div>

      <FabButton title="Crear movimiento" onClick={openCreate}>
        <FiPlus size={22} />
      </FabButton>

      {/* Modal de crear/editar movimiento siguiendo el mismo estilo que barrio/comercio/producto */
      }
      <FormDialog
        open={formOpen}
        title={modeParam === 'edit' ? 'Editar movimiento' : 'Crear movimiento'}
        icon={modeParam === 'edit' ? 'edit' : 'plus'}
        size="lg"
        hideActions
        onCancel={leaveForm}
      >
        <MovimientosForm
          mode={modeParam === 'edit' ? 'edit' : 'create'}
          editId={editId}
          onCancel={leaveForm}
          onSaved={() => { load(); leaveForm(); }}
          initialTipo={typeParam}
          initialProducto={productParam}
          initialComercio={comercioParam}
          initialFecha={selectedDate}
        />
      </FormDialog>
    </div>
  );
}

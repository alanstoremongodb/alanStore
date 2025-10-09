// client/src/pages/ComercioDetalle.jsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { alertSuccess, alertError, confirmDanger } from '../lib/dialog';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPhone, FiMapPin, FiRepeat, FiDollarSign } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Card from '../components/ui/Card';
import OutlineButton from '../components/ui/OutlineButton';
import ActionButton from '../components/ui/ActionButton';
import { darkTheme as t } from '../components/ui/theme';
import StockTable from '../components/ui/StockTable';

const onlyDigits = (s = '') => String(s).replace(/\D/g, '');

export default function ComercioDetalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const [comercio, setComercio] = useState(null);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [c, inv] = await Promise.all([api.get(`/comercios/${id}`), api.get('/inventario')]);
      setComercio(c.data.comercio || null);
      setInventario(inv.data.inventario || []);
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar el comercio');
      const fallback = '/comercios';
      const from = loc.state?.from || fallback;
      nav(from, { replace: true });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const invComercio = useMemo(() => inventario.filter(r => r.comercio?._id === id), [inventario, id]);

  const handleEditar = () => nav(`/comercios?edit=${id}&back=/comercios/${id}`);
  const handleEliminar = async () => {
    const ok = await confirmDanger(`¿Eliminar comercio "${comercio?.nombre}"?`);
    if (!ok) return;
    try {
      await api.delete(`/comercios/${id}`);
      await alertSuccess('Comercio eliminado');
      nav('/comercios', { replace: true });
    } catch (e) { await alertError(e?.response?.data?.error || 'Error eliminando comercio'); }
  };

  // ===== Helpers de acciones =====
  const telDigits = onlyDigits(comercio?.telefono);
  const waDigits = onlyDigits(comercio?.whatsapp);
  const telHref = telDigits ? `tel:+54${telDigits}` : null;
  const waHref = waDigits
    ? `https://wa.me/54${waDigits}`
    : null;

  const destino =
    [comercio?.calle, comercio?.altura].filter(Boolean).join(' ');
  const mapsHref = destino
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destino)}`
    : null;

  if (loading) return <div className="py-4" style={{ background: t.bg, color: t.text900 }}>Cargando…</div>;
  if (!comercio) return null;

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
          {comercio.nombre}
        </h3>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionButton aria-label="Editar comercio" title="Editar" onClick={handleEditar}>
            <FiEdit2 size={18} />
          </ActionButton>
          <ActionButton aria-label="Eliminar comercio" title="Eliminar" onClick={handleEliminar}>
            <FiTrash2 size={18} />
          </ActionButton>
        </div>
      </div>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600, textAlign: 'center' }}>Accesos rápidos</h6>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <ActionButton
            title={telHref ? `Llamar ${comercio.telefono}` : 'Sin teléfono'}
            aria-label="Llamar"
            onClick={() => { if (telHref) window.location.assign(telHref); }}
          >
            <FiPhone size={18} />
          </ActionButton>
          <ActionButton
            title={waHref ? `WhatsApp ${comercio.whatsapp}` : 'Sin WhatsApp'}
            aria-label="WhatsApp"
            onClick={() => { if (waHref) window.open(waHref, '_blank', 'noopener'); }}
          >
            <FaWhatsapp size={18} />
          </ActionButton>
          <ActionButton
            title={mapsHref ? `Cómo llegar a ${destino}` : 'Dirección incompleta'}
            aria-label="Indicaciones"
            onClick={() => { if (mapsHref) window.open(mapsHref, '_blank', 'noopener'); }}
          >
            <FiMapPin size={18} />
          </ActionButton>
        </div>
      </Card>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600, textAlign: 'center' }}>Movimientos</h6>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <ActionButton
            title="Nueva reposición"
            aria-label="Reposición"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=reposicion&comercio=${id}&date=${hoy}`);
            }}
          >
            <FiRepeat size={18} />
          </ActionButton>
          <ActionButton
            title="Nueva venta"
            aria-label="Venta"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=venta&comercio=${id}&date=${hoy}`);
            }}
          >
            <FiDollarSign size={18} />
          </ActionButton>
        </div>
      </Card>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600 }}>Datos</h6>
        <div className="row g-2 small">
          <div className="col-12 col-md-6">
            <div className="text-secondary" style={{ color: t.text600 }}>Dirección</div>
            <div style={{ color: t.text900 }}>
              {[comercio.calle, comercio.altura].filter(Boolean).join(' ')}
              {comercio.piso ? `, Piso ${comercio.piso}` : ''}
              {comercio.departamento ? `, Depto ${comercio.departamento}` : ''}
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Barrio</div>
            <div style={{ color: t.text900 }}>{comercio.barrio?.nombre || '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Responsable</div>
            <div style={{ color: t.text900 }}>{comercio.responsable || '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Teléfono</div>
            <div style={{ color: t.text900 }}>{comercio.telefono || '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>WhatsApp</div>
            <div style={{ color: t.text900 }}>{comercio.whatsapp || '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Inicio contrato</div>
            <div style={{ color: t.text900 }}>{comercio.inicioContrato ? new Date(comercio.inicioContrato).toLocaleDateString('es-AR') : '-'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Contrato</div>
            <div style={{ color: t.text900 }}>{comercio.contratoFirmado ? 'Firmado' : 'Pendiente'}</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Deuda</div>
            <div style={{ color: t.text900 }}>{comercio.deuda != null ? `$${Number(comercio.deuda).toLocaleString('es-AR')}` : '-'}</div>
          </div>
        </div>
      </Card>

      

      <Card>
        <h6 className="mb-2" style={{ color: t.text600 }}>Stock en este comercio</h6>
        {invComercio.length ? (
          <StockTable rows={invComercio} />
        ) : (
          <div className="text-secondary small" style={{ color: t.text600 }}>Sin stock en este comercio</div>
        )}
      </Card>

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <OutlineButton
          variant="secondary"
          onClick={() => {
            const fallback = '/comercios';
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

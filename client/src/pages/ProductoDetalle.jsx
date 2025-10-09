import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { alertSuccess, alertError, confirmDanger } from '../lib/dialog';
import { FiEdit2, FiTrash2, FiArrowLeft, FiPlusCircle, FiRepeat, FiDollarSign, FiXCircle } from 'react-icons/fi';
import Card from '../components/ui/Card';
import OutlineButton from '../components/ui/OutlineButton';
import ActionButton from '../components/ui/ActionButton';
import { darkTheme as t } from '../components/ui/theme';

export default function ProductoDetalle() {
  const { id } = useParams();
  const nav = useNavigate();
  const loc = useLocation();

  const [producto, setProducto] = useState(null);
  const [stockPropio, setStockPropio] = useState(0);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [p, sp, inv] = await Promise.all([
        api.get(`/productos/${id}`),
        api.get('/stock-propio'),
        api.get('/inventario')
      ]);

      setProducto(p.data.producto || null);

      const spRows = sp.data.stock || [];
      const propio = spRows.find(r => r.producto?._id === id)?.cantidadCalc ?? 0;
      setStockPropio(propio);

      const invRows = (inv.data.inventario || []).filter(r => r.producto?._id === id);
      setInventario(invRows);
    } catch (e) {
      await alertError(e?.response?.data?.error || 'No se pudo cargar el producto');
  const fallback = '/productos';
  const from = loc.state?.from || fallback;
  nav(from, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const invOrdenado = useMemo(() => {
    return [...inventario].sort((a, b) => {
      const an = a.comercio?.nombre || '';
      const bn = b.comercio?.nombre || '';
      return an.localeCompare(bn);
    });
  }, [inventario]);

  const handleEditar = () => nav(`/productos?edit=${id}&back=/productos/${id}`);
  const handleEliminar = async () => {
    const ok = await confirmDanger(`¿Eliminar producto "${producto?.nombre}"?`);
    if (!ok) return;
    try {
      await api.delete(`/productos/${id}`);
      await alertSuccess('Producto eliminado');
      nav('/productos', { replace: true });
    } catch (e) {
      await alertError(e?.response?.data?.error || 'Error eliminando producto');
    }
  };

  if (loading) return <div className="py-4" style={{ background: t.bg, color: t.text900 }}>Cargando…</div>;
  if (!producto) return null;

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
          {producto.nombre}
        </h3>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <ActionButton aria-label="Editar producto" title="Editar" onClick={handleEditar}>
            <FiEdit2 size={18} />
          </ActionButton>
          <ActionButton aria-label="Eliminar producto" title="Eliminar" onClick={handleEliminar}>
            <FiTrash2 size={18} />
          </ActionButton>
        </div>
      </div>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600, textAlign: 'center' }}>Movimientos</h6>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <ActionButton
            title="Nueva carga de este producto"
            aria-label="Carga"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=carga&product=${id}&date=${hoy}`);
            }}
          >
            <FiPlusCircle size={18} />
          </ActionButton>
          <ActionButton
            title="Nueva reposición de este producto"
            aria-label="Reposición"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=reposicion&product=${id}&date=${hoy}`);
            }}
          >
            <FiRepeat size={18} />
          </ActionButton>
          <ActionButton
            title="Nueva venta de este producto"
            aria-label="Venta"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=venta&product=${id}&date=${hoy}`);
            }}
          >
            <FiDollarSign size={18} />
          </ActionButton>
          <ActionButton
            title="Reportar faltante de este producto"
            aria-label="Faltante"
            onClick={() => {
              const hoy = new Date().toISOString().slice(0, 10);
              nav(`/movimientos?mode=create&type=faltante&product=${id}&date=${hoy}`);
            }}
          >
            <FiXCircle size={18} />
          </ActionButton>
        </div>
      </Card>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600 }}>Datos</h6>
        <div className="row g-2 small">
          <div className="col-6 col-md-3">
            <div className="text-secondary" style={{ color: t.text600 }}>Precio lista</div>
            <div style={{ color: t.text900 }}>${(producto.precioLista ?? 0).toLocaleString('es-AR')}</div>
          </div>
          <div className="col-12">
            <div className="text-secondary" style={{ color: t.text600 }}>Descripción</div>
            <div style={{ color: t.text900 }}>{producto.descripcion || '-'}</div>
          </div>
        </div>
      </Card>

      <Card className="mb-3">
        <h6 className="mb-2" style={{ color: t.text600 }}>Stock propio</h6>
        <div className="fs-5" style={{ color: t.text900 }}>{stockPropio}</div>
      </Card>

      <Card>
        <h6 className="mb-2" style={{ color: t.text600 }}>Inventario en comercios</h6>
        {invOrdenado.length ? (
          <div className="table-responsive" style={{ borderRadius: 10, overflow: 'hidden' }}>
            <table
              className="table table-sm align-middle"
              style={{
                color: t.text900,
                background: 'transparent',
                '--bs-table-color': t.text900,
                '--bs-table-striped-color': t.text900,
                '--bs-table-hover-color': t.text900,
                '--bs-table-bg': 'transparent',
                '--bs-table-striped-bg': 'transparent',
                '--bs-table-hover-bg': 'rgba(255,255,255,.04)'
              }}
            >
              <thead>
                <tr>
                  <th style={{ color: t.text600, borderColor: 'rgba(255,255,255,.08)', background: 'transparent' }}>Comercio</th>
                  <th style={{ color: t.text600, borderColor: 'rgba(255,255,255,.08)', background: 'transparent' }}>Barrio</th>
                  <th className="text-end" style={{ color: t.text600, borderColor: 'rgba(255,255,255,.08)', background: 'transparent' }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {invOrdenado.map((r, i) => (
                  <tr key={`${r.comercio?._id}-${i}`}>
                    <td style={{ borderColor: 'rgba(255,255,255,.04)', background: 'transparent', color: t.text900 }}>{r.comercio?.nombre}</td>
                    <td style={{ borderColor: 'rgba(255,255,255,.04)', background: 'transparent', color: t.text900 }}>{r.comercio?.barrio?.nombre || '-'}</td>
                    <td className="text-end" style={{ borderColor: 'rgba(255,255,255,.04)', background: 'transparent', color: t.text900 }}>{r.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-secondary small" style={{ color: t.text600 }}>Sin stock de este producto en comercios</div>
        )}
      </Card>

      <div style={{ marginTop: 30, display: 'flex', justifyContent: 'center' }}>
        <OutlineButton
          variant="secondary"
          onClick={() => {
            const fallback = '/productos';
            const from = loc.state?.from || fallback;
            if (typeof from === 'string') return nav(from, { replace: true });
            // Si viene como objeto location-like
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

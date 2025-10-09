import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Card from '../components/ui/Card';
import { darkTheme as t } from '../components/ui/theme';
import SearchBar from '../components/ui/SearchBar';
import Avatar from '../components/ui/Avatar';
import ActionButton from '../components/ui/ActionButton';
import StockTable from '../components/ui/StockTable';
import { FiSearch } from 'react-icons/fi';
import { HiDevicePhoneMobile } from 'react-icons/hi2';
import { GiShop, GiVillage } from 'react-icons/gi';

export default function Stock() {
  const [propio, setPropio] = useState([]);
  const [inv, setInv] = useState([]);
  const [err1, setErr1] = useState('');
  const [err2, setErr2] = useState('');
  const [view, setView] = useState('productos'); // 'productos' | 'comercios' | 'barrios'
  const [q, setQ] = useState('');
  const loc = useLocation();
  const nav = useNavigate();
  // Color de borde activo (azul)
  const activeOutline = '#0d6efd';

  useEffect(() => {
    (async () => {
      try { const r1 = await api.get('/stock-propio'); setPropio(r1.data.stock || []); }
      catch (e) { setErr1(e?.response?.data?.error || 'No se pudo cargar stock propio'); }
      try { const r2 = await api.get('/inventario'); setInv(r2.data.inventario || []); }
      catch (e) { setErr2(e?.response?.data?.error || 'No se pudo cargar inventario'); }
    })();
  }, []);

  // Param para tema iOS opcional (igual que en Barrios/Productos)
  const themeParam = new URLSearchParams(loc.search).get('theme') || new URLSearchParams(loc.search).get('ios');
  const isIosDark = typeof themeParam === 'string' && ['1','true','yes','ios','ios-dark','dark'].includes(themeParam.toLowerCase());

  // Agrupar por producto
  const porProducto = useMemo(() => {
    const map = new Map(); // productId -> { producto, total, propio, detalle: [{ comercio, cantidad }] }
    for (const r of propio) {
      const pid = r?.producto?._id; if (!pid) continue;
      if (!map.has(pid)) map.set(pid, { producto: r.producto, total: 0, propio: 0, detalle: [] });
      const b = map.get(pid);
      const qty = Number(r.cantidadCalc ?? r.cantidad ?? 0);
      b.propio += qty; b.total += qty;
    }
    for (const r of inv) {
      const pid = r?.producto?._id; if (!pid) continue;
      if (!map.has(pid)) map.set(pid, { producto: r.producto, total: 0, propio: 0, detalle: [] });
      const b = map.get(pid);
      const qty = Number(r.cantidad ?? 0);
      b.total += qty;
      b.detalle.push({ comercio: r.comercio, cantidad: qty });
    }
    const arr = Array.from(map.values()).map(x => ({
      ...x,
      detalle: x.detalle
        .reduce((acc, d) => { // merge por comercio si repite
          const id = d.comercio?._id || 'PROPIO';
          const i = acc.findIndex(z => (z.comercio?._id || 'PROPIO') === id);
          if (i >= 0) acc[i] = { comercio: acc[i].comercio, cantidad: acc[i].cantidad + d.cantidad };
          else acc.push({ comercio: d.comercio, cantidad: d.cantidad });
          return acc;
        }, [])
        .sort((a, b) => {
          if (!a.comercio && !b.comercio) return 0;
          if (!a.comercio) return -1;
          if (!b.comercio) return 1;
          return (a.comercio?.nombre || '').localeCompare(b.comercio?.nombre || '');
        })
    }));
    return arr.sort((a, b) => (a.producto?.nombre || '').localeCompare(b.producto?.nombre || ''));
  }, [propio, inv]);

  // Agrupar por comercio (incluye Stock Propio como "comercio" null)
  const porComercio = useMemo(() => {
    const map = new Map(); // comercioId|'PROPIO' -> { comercio|null, total, detalle: [{ producto, cantidad }] }
    // Stock Propio primero
    for (const r of propio) {
      const key = 'PROPIO';
      if (!map.has(key)) map.set(key, { comercio: null, total: 0, detalle: [] });
      const b = map.get(key);
      const qty = Number(r.cantidadCalc ?? r.cantidad ?? 0);
      b.total += qty;
      b.detalle.push({ producto: r.producto, cantidad: qty });
    }
    for (const r of inv) {
      const key = r?.comercio?._id; if (!key) continue;
      if (!map.has(key)) map.set(key, { comercio: r.comercio, total: 0, detalle: [] });
      const b = map.get(key);
      const qty = Number(r.cantidad ?? 0);
      b.total += qty;
      b.detalle.push({ producto: r.producto, cantidad: qty });
    }
    const arr = Array.from(map.values()).map(x => ({
      ...x,
      detalle: x.detalle
        .reduce((acc, d) => { // merge por producto
          const id = d.producto?._id;
          const i = acc.findIndex(z => z.producto?._id === id);
          if (i >= 0) acc[i] = { producto: acc[i].producto, cantidad: acc[i].cantidad + d.cantidad };
          else acc.push({ producto: d.producto, cantidad: d.cantidad });
          return acc;
        }, [])
        .sort((a, b) => (a.producto?.nombre || '').localeCompare(b.producto?.nombre || ''))
    }));
    // Orden: Stock Propio primero, luego comercios por nombre
    return arr.sort((a, b) => {
      if (!a.comercio && !b.comercio) return 0;
      if (!a.comercio) return -1;
      if (!b.comercio) return 1;
      return (a.comercio?.nombre || '').localeCompare(b.comercio?.nombre || '');
    });
  }, [propio, inv]);

  // Agrupar por barrio (solo inventario en comercios, stock propio no tiene barrio)
  const porBarrio = useMemo(() => {
    const map = new Map(); // barrioId -> { barrio, detalle: [{ producto, cantidad }] }
    for (const r of inv) {
      const b = r?.comercio?.barrio; if (!b?._id) continue;
      const key = b._id;
      if (!map.has(key)) map.set(key, { barrio: b, detalle: [] });
      const bucket = map.get(key);
      const qty = Number(r.cantidad ?? 0);
      bucket.detalle.push({ producto: r.producto, cantidad: qty });
    }
    const arr = Array.from(map.values()).map(x => ({
      ...x,
      detalle: x.detalle
        .reduce((acc, d) => { // merge por producto
          const id = d.producto?._id;
          const i = acc.findIndex(z => z.producto?._id === id);
          if (i >= 0) acc[i] = { producto: acc[i].producto, cantidad: acc[i].cantidad + d.cantidad };
          else acc.push({ producto: d.producto, cantidad: d.cantidad });
          return acc;
        }, [])
        .sort((a, b) => (a.producto?.nombre || '').localeCompare(b.producto?.nombre || ''))
    }))
    .sort((a, b) => (a.barrio?.nombre || '').localeCompare(b.barrio?.nombre || ''));
    return arr;
  }, [inv]);

  const f = q.trim().toLowerCase();
  const productosFiltrados = view === 'productos'
    ? porProducto.filter(p => (p.producto?.nombre || '').toLowerCase().includes(f))
    : [];
  const comerciosFiltrados = view === 'comercios'
    ? porComercio.filter(c => ((c.comercio?.nombre || 'Stock Propio').toLowerCase().includes(f)))
    : [];
  const barriosFiltrados = view === 'barrios'
    ? porBarrio.filter(b => (b.barrio?.nombre || '').toLowerCase().includes(f))
    : [];

  return (
    <div
      className={`stock ${isIosDark ? 'ios-dark' : ''}`}
      style={{
        background: t.bg, color: t.text900, padding: '0 .75rem 16px', boxSizing: 'border-box',
        marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', overflowX: 'hidden', position: 'relative'
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Stock</h1>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-12 col-md-6 col-lg-4 mt-2 mb-4">
          <div className="vstack gap-2">
            <SearchBar
              value={q}
              onChange={setQ}
              onClear={() => setQ('')}
              placeholder={view === 'productos' ? 'Buscar producto...' : view === 'comercios' ? 'Buscar comercio...' : 'Buscar barrio...'}
              icon={<FiSearch size={18} aria-hidden className="search-icon" />}
            />
            <label className="small" style={{ color: t.text600 }}>Agrupar por:</label>
            <div className="d-flex gap-4 align-items-center justify-content-center">
              {/* Producto */}
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setView('productos')}
                  aria-pressed={view === 'productos'}
                  title="Agrupar por producto"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{ padding: 2, borderRadius: 16, boxShadow: view === 'productos' ? `0 0 0 2px ${activeOutline}` : 'none' }}>
                    <Avatar>
                      <HiDevicePhoneMobile size={22} />
                    </Avatar>
                  </div>
                </button>
                <div className="small mt-1" style={{ color: view === 'productos' ? t.text900 : t.text600 }}>Producto</div>
              </div>

              {/* Comercio */}
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setView('comercios')}
                  aria-pressed={view === 'comercios'}
                  title="Agrupar por comercio"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{ padding: 2, borderRadius: 16, boxShadow: view === 'comercios' ? `0 0 0 2px ${activeOutline}` : 'none' }}>
                    <Avatar>
                      <GiShop size={22} />
                    </Avatar>
                  </div>
                </button>
                <div className="small mt-1" style={{ color: view === 'comercios' ? t.text900 : t.text600 }}>Comercio</div>
              </div>

              {/* Barrio */}
              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setView('barrios')}
                  aria-pressed={view === 'barrios'}
                  title="Agrupar por barrio"
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <div style={{ padding: 2, borderRadius: 16, boxShadow: view === 'barrios' ? `0 0 0 2px ${activeOutline}` : 'none' }}>
                    <Avatar>
                      <GiVillage size={22} />
                    </Avatar>
                  </div>
                </button>
                <div className="small mt-1" style={{ color: view === 'barrios' ? t.text900 : t.text600 }}>Barrio</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista: Por producto */}
      {view === 'productos' && (
        <div className="row g-3">
          {productosFiltrados.map((p) => (
            <div key={p.producto?._id} className="col-12 col-md-6 col-lg-4">
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
                        title={p.producto?.nombre}
                      >
                        {p.producto?.nombre}
                      </h6>
                    </div>
                  </div>
                  {p.producto?._id && (
                    <ActionButton title="Ver" ariaLabel="Ver producto" onClick={() => nav(`/productos/${p.producto._id}`, { state: { from: `${loc.pathname}${loc.search}` || '/stock' } })}>
                      <FiSearch size={22} />
                    </ActionButton>
                  )}
                </div>
                {/* Tabla de detalle abajo */}
                <div className="mt-3">
                  {(() => {
                    const rows = [
                      { label: 'Stock Propio', cantidad: p.propio },
                      ...p.detalle.map(d => ({ label: d.comercio?.nombre || '—', cantidad: d.cantidad }))
                    ];
                    return (
                      <StockTable rows={rows} getName={(r)=>r.label} getQty={(r)=>r.cantidad} />
                    );
                  })()}
                </div>
              </Card>
            </div>
          ))}
          {!err1 && !err2 && !productosFiltrados.length && (
            <div className="col-12">
              <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
                <p className="mb-0" style={{ color: t.text600 }}>Sin resultados.</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Vista: Por comercio */}
      {view === 'comercios' && (
        <div className="row g-3">
          {comerciosFiltrados.map((c, i) => (
            <div key={c.comercio?._id || `PROPIO-${i}`} className="col-12 col-md-6 col-lg-4">
              <Card>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3 me-2 flex-grow-1" style={{ minWidth: 0 }}>
                    <Avatar>
                      <GiShop size={18} />
                    </Avatar>
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <h6
                        className="m-0 fw-semibold text-truncate"
                        style={{ letterSpacing: '0.2px', color: t.text900 }}
                        title={c.comercio ? c.comercio.nombre : 'Stock Propio'}
                      >
                        {c.comercio ? c.comercio.nombre : 'Stock Propio'}
                      </h6>
                    </div>
                  </div>
                  {c.comercio?._id && (
                    <ActionButton title="Ver" ariaLabel="Ver comercio" onClick={() => nav(`/comercios/${c.comercio._id}`, { state: { from: `${loc.pathname}${loc.search}` || '/stock' } })}>
                      <FiSearch size={22} />
                    </ActionButton>
                  )}
                </div>
                {/* Tabla de detalle abajo */}
                <div className="mt-3">
                  <StockTable rows={c.detalle} getQty={(r)=>r.cantidad} />
                </div>
              </Card>
            </div>
          ))}
          {!err1 && !err2 && !comerciosFiltrados.length && (
            <div className="col-12">
              <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
                <p className="mb-0" style={{ color: t.text600 }}>Sin resultados.</p>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Vista: Por barrio */}
      {view === 'barrios' && (
        <div className="row g-3">
          {barriosFiltrados.map((b) => (
            <div key={b.barrio?._id} className="col-12 col-md-6 col-lg-4">
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
                        title={b.barrio?.nombre}
                      >
                        {b.barrio?.nombre}
                      </h6>
                    </div>
                  </div>
                  {b.barrio?._id && (
                    <ActionButton title="Ver" ariaLabel="Ver barrio" onClick={() => nav(`/barrios/${b.barrio._id}`, { state: { from: `${loc.pathname}${loc.search}` || '/stock' } })}>
                      <FiSearch size={22} />
                    </ActionButton>
                  )}
                </div>
                <div className="mt-3">
                  <StockTable rows={b.detalle} getQty={(r)=>r.cantidad} />
                </div>
              </Card>
            </div>
          ))}
          {!err1 && !err2 && !barriosFiltrados.length && (
            <div className="col-12">
              <Card className="text-center" style={{ borderRadius: 16 }} bodyClassName="card-body py-5">
                <p className="mb-0" style={{ color: t.text600 }}>Sin resultados.</p>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
    
  );
}

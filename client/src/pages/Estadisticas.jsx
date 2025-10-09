import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import { darkTheme as t } from '../components/ui/theme';

const ECON_UNITS = [
  { v:'mes', t:'Mes' },
  { v:'trimestre', t:'Trimestre' },
  { v:'año', t:'Año' },
];
const UNITS_UNIDADES = [
  { v:'repo1', t:'Reposición 1 (1–15)' },
  { v:'repo2', t:'Reposición 2 (16–31)' },
  { v:'mes', t:'Mes' },
  { v:'trimestre', t:'Trimestre' },
  { v:'año', t:'Año' },
];
const GROUPS_UNIDADES = [
  { v:'producto', t:'Producto' },
  { v:'comercio', t:'Comercio' },
  { v:'barrio', t:'Barrio' },
];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const fmtMoney = (n) => `$${Number(n||0).toLocaleString('es-AR')}`;

export default function Estadisticas() {
  const now = new Date();
  const [mode, setMode] = useState('economico'); // 'economico' | 'unidades'

  // Estilos oscuros para controles (selects/inputs)
  const controlBase = useMemo(() => ({
    background: t.surface2,
    border: t.border,
    color: t.text900,
    borderRadius: 12,
  }), []);
  const selectStyle = controlBase;
  const inputStyle = controlBase;

  // Estado para Económico
  const [qe, setQe] = useState({
    unit: 'mes',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    quarter: 1,
    filterProducto: '',
    filterComercio: '',
    filterBarrio: '',
  });
  // Estado para Unidades
  const [qu, setQu] = useState({
    unit: 'mes',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    quarter: 1,
    groupBy: 'producto',
    filterProducto: '',
    filterComercio: '',
    filterBarrio: '',
  });

  // Datos
  const [rowsE, setRowsE] = useState([]); // groupBy=tipo
  const [rowsU, setRowsU] = useState([]); // groupBy variable
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [productos, setProductos] = useState([]);
  const [comercios, setComercios] = useState([]);
  const [barrios, setBarrios] = useState([]);

  // Cargar catálogos básicos para filtros
  useEffect(() => {
    (async () => {
      try {
        const [rp, rc, rb] = await Promise.all([
          api.get('/productos'),
          api.get('/comercios'),
          api.get('/barrios'),
        ]);
        setProductos(rp.data.productos || []);
        setComercios(rc.data.comercios || []);
        setBarrios(rb.data.barrios || []);
      } catch {}
    })();
  }, []);

  const fetchEconomico = async () => {
    const p = new URLSearchParams();
    p.set('unit', qe.unit);
    p.set('year', qe.year);
    if (qe.unit === 'mes') p.set('month', qe.month);
    if (qe.unit === 'trimestre') p.set('quarter', qe.quarter);
    p.set('groupBy', 'tipo');
    if (qe.filterProducto) p.set('filterProducto', qe.filterProducto);
    if (qe.filterComercio) p.set('filterComercio', qe.filterComercio);
    if (qe.filterBarrio) p.set('filterBarrio', qe.filterBarrio);
    const r = await api.get(`/estadisticas?${p.toString()}`);
    return r.data.resultados || [];
  };
  const fetchUnidades = async () => {
    const p = new URLSearchParams();
    p.set('unit', qu.unit);
    p.set('year', qu.year);
    if (['mes','repo1','repo2'].includes(qu.unit)) p.set('month', qu.month);
    if (qu.unit === 'trimestre') p.set('quarter', qu.quarter);
    p.set('groupBy', qu.groupBy);
    if (qu.filterProducto) p.set('filterProducto', qu.filterProducto);
    if (qu.filterComercio) p.set('filterComercio', qu.filterComercio);
    if (qu.filterBarrio) p.set('filterBarrio', qu.filterBarrio);
    const r = await api.get(`/estadisticas?${p.toString()}`);
    return r.data.resultados || [];
  };

  const consultar = async () => {
    try {
      setLoading(true); setErr('');
      if (mode === 'economico') {
        const res = await fetchEconomico();
        setRowsE(res);
      } else {
        const res = await fetchUnidades();
        setRowsU(res);
      }
    } catch (e) {
      setErr(e?.response?.data?.error || 'No se pudo obtener estadísticas');
    } finally { setLoading(false); }
  };

  // Auto-consulta: cuando cambia el modo o filtros relevantes
  useEffect(() => {
    consultar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, qe.unit, qe.year, qe.month, qe.quarter, qe.filterProducto, qe.filterComercio, qe.filterBarrio, qu.unit, qu.year, qu.month, qu.quarter, qu.groupBy, qu.filterProducto, qu.filterComercio, qu.filterBarrio]);

  // ========= Económico: cálculo =========
  const economico = useMemo(() => {
    const byTipo = (tipo) => rowsE.find(r => (r.tipo || r._id) === tipo);
    const venta = byTipo('venta');
    const carga = byTipo('carga');
    const faltante = byTipo('faltante');
    // Revalorización/Actualizaciones se reconoce en la compra del período (carga.resultadoActualizacion)
  const ventas = Number(venta?.ventas || 0);
    const cmv = Number(venta?.costo || 0); // costo de mercadería vendida
    const actualizaciones = Number(carga?.resultadoActualizacion || 0);
    const perdidasFaltante = Number(faltante?.costo || 0);
    const bruto = ventas - cmv;
    const neto = bruto + actualizaciones - perdidasFaltante;
    return { ventas, cmv, actualizaciones, faltantes: perdidasFaltante, bruto, neto };
  }, [rowsE]);

  // ========= Unidades: ranking =========
  const unidadesOrdenadas = useMemo(() => {
    return [...rowsU]
      .sort((a,b) => (b.unidadesFisicas||0) - (a.unidadesFisicas||0));
  }, [rowsU]);

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
        minHeight: '100dvh'
      }}
    >
      <div aria-hidden style={{ position: 'fixed', inset: 0, background: t.bg, zIndex: -1 }} />

      <div className="row mb-3">
        <div className="col-12 col-md-6 col-lg-4">
          <h1 className="m-0 fw-semibold text-center" style={{ letterSpacing: '.2px', color: t.text900 }}>Estadísticas</h1>
        </div>
      </div>

      {/* Selector de modo */}
      <div className="d-flex justify-content-center mb-3" style={{ gap: 8 }}>
        <button
          type="button"
          onClick={()=>setMode('economico')}
          className="btn"
          style={{
            borderRadius: 8,
            border: mode==='economico' ? '1px solid rgba(255,255,255,.24)' : '1px solid rgba(255,255,255,.12)',
            background: mode==='economico' ? 'rgba(255,255,255,.08)' : 'transparent',
            color: t.text900,
            padding: '8px 12px',
            fontWeight: 600,
          }}
        >Económico</button>
        <button
          type="button"
          onClick={()=>setMode('unidades')}
          className="btn"
          style={{
            borderRadius: 8,
            border: mode==='unidades' ? '1px solid rgba(255,255,255,.24)' : '1px solid rgba(255,255,255,.12)',
            background: mode==='unidades' ? 'rgba(255,255,255,.08)' : 'transparent',
            color: t.text900,
            padding: '8px 12px',
            fontWeight: 600,
          }}
        >Unidades</button>
      </div>

      {/* Controles agrupados en Cards */}
      {mode === 'economico' ? (
        <>
          <Card className="mb-2">
            <h6 className="mb-2" style={{ color: t.text900 }}>Período</h6>
            <div className="row g-2 align-items-end">
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ color: t.text600 }}>Unidad</label>
                <select className="form-select" style={selectStyle} value={qe.unit} onChange={e=>setQe({ ...qe, unit: e.target.value })}>
                  {ECON_UNITS.map(u => <option key={u.v} value={u.v}>{u.t}</option>)}
                </select>
              </div>
              {qe.unit === 'mes' && (
                <div className="col-6 col-md-3">
                  <label className="form-label" style={{ color: t.text600 }}>Mes</label>
                  <select className="form-select" style={selectStyle} value={qe.month} onChange={e=>setQe({ ...qe, month: Number(e.target.value) })}>
                    {MONTHS.map((m, idx) => (<option key={idx+1} value={idx+1}>{m}</option>))}
                  </select>
                </div>
              )}
              {qe.unit === 'trimestre' && (
                <div className="col-6 col-md-3">
                  <label className="form-label" style={{ color: t.text600 }}>Trimestre</label>
                  <select className="form-select" style={selectStyle} value={qe.quarter} onChange={e=>setQe({ ...qe, quarter: Number(e.target.value) })}>
                    {[1,2,3,4].map(qt => <option key={qt} value={qt}>{qt}</option>)}
                  </select>
                </div>
              )}
              <div className="col-6 col-md-2">
                <label className="form-label" style={{ color: t.text600 }}>Año</label>
                <input type="number" className="form-control" style={inputStyle} value={qe.year} onChange={e=>setQe({ ...qe, year: Number(e.target.value) })} />
              </div>
            </div>
          </Card>
          <Card className="mb-3">
            <h6 className="mb-2" style={{ color: t.text900 }}>Filtrar por:</h6>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Producto</label>
                <select className="form-select" style={selectStyle} value={qe.filterProducto} onChange={e=>setQe({ ...qe, filterProducto: e.target.value, filterComercio: '', filterBarrio: '' })}>
                  <option value="">Todos</option>
                  {productos.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Comercio</label>
                <select className="form-select" style={selectStyle} value={qe.filterComercio} onChange={e=>setQe({ ...qe, filterComercio: e.target.value, filterProducto: '', filterBarrio: '' })}>
                  <option value="">Todos</option>
                  {comercios.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Barrio</label>
                <select className="form-select" style={selectStyle} value={qe.filterBarrio} onChange={e=>setQe({ ...qe, filterBarrio: e.target.value, filterProducto: '', filterComercio: '' })}>
                  <option value="">Todos</option>
                  {barrios.map(b => <option key={b._id} value={b._id}>{b.nombre}</option>)}
                </select>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card className="mb-2">
            <h6 className="mb-2" style={{ color: t.text900 }}>Período</h6>
            <div className="row g-2 align-items-end">
              <div className="col-6 col-md-3">
                <label className="form-label" style={{ color: t.text600 }}>Unidad</label>
                <select className="form-select" style={selectStyle} value={qu.unit} onChange={e=>setQu({ ...qu, unit: e.target.value })}>
                  {UNITS_UNIDADES.map(u => <option key={u.v} value={u.v}>{u.t}</option>)}
                </select>
              </div>
              {['mes','repo1','repo2'].includes(qu.unit) && (
                <div className="col-6 col-md-3">
                  <label className="form-label" style={{ color: t.text600 }}>Mes</label>
                  <select className="form-select" style={selectStyle} value={qu.month} onChange={e=>setQu({ ...qu, month: Number(e.target.value) })}>
                    {MONTHS.map((m, idx) => (<option key={idx+1} value={idx+1}>{m}</option>))}
                  </select>
                </div>
              )}
              {qu.unit === 'trimestre' && (
                <div className="col-6 col-md-3">
                  <label className="form-label" style={{ color: t.text600 }}>Trimestre</label>
                  <select className="form-select" style={selectStyle} value={qu.quarter} onChange={e=>setQu({ ...qu, quarter: Number(e.target.value) })}>
                    {[1,2,3,4].map(qt => <option key={qt} value={qt}>{qt}</option>)}
                  </select>
                </div>
              )}
              <div className="col-6 col-md-2">
                <label className="form-label" style={{ color: t.text600 }}>Año</label>
                <input type="number" className="form-control" style={inputStyle} value={qu.year} onChange={e=>setQu({ ...qu, year: Number(e.target.value) })} />
              </div>
            </div>
          </Card>
          <Card className="mb-2">
            <h6 className="mb-2" style={{ color: t.text900 }}>Agrupar por</h6>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <select className="form-select" style={selectStyle} value={qu.groupBy} onChange={e=>setQu({ ...qu, groupBy: e.target.value })}>
                  {GROUPS_UNIDADES.map(g => <option key={g.v} value={g.v}>{g.t}</option>)}
                </select>
              </div>
            </div>
          </Card>
          <Card className="mb-3">
            <h6 className="mb-2" style={{ color: t.text900 }}>Filtrar por:</h6>
            <div className="row g-2 align-items-end">
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Producto</label>
                <select className="form-select" style={selectStyle} value={qu.filterProducto} onChange={e=>setQu({ ...qu, filterProducto: e.target.value, filterComercio: '', filterBarrio: '' })}>
                  <option value="">Todos</option>
                  {productos.map(p => <option key={p._id} value={p._id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Comercio</label>
                <select className="form-select" style={selectStyle} value={qu.filterComercio} onChange={e=>setQu({ ...qu, filterComercio: e.target.value, filterProducto: '', filterBarrio: '' })}>
                  <option value="">Todos</option>
                  {comercios.map(c => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label" style={{ color: t.text600 }}>Barrio</label>
                <select className="form-select" style={selectStyle} value={qu.filterBarrio} onChange={e=>setQu({ ...qu, filterBarrio: e.target.value, filterProducto: '', filterComercio: '' })}>
                  <option value="">Todos</option>
                  {barrios.map(b => <option key={b._id} value={b._id}>{b.nombre}</option>)}
                </select>
              </div>
            </div>
          </Card>
        </>
      )}

      {err && (
        <Card className="mb-3">
          <div className="text-danger">{err}</div>
        </Card>
      )}

      {/* Render */}
      {mode === 'economico' ? (
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Ventas</h6>
              <div className="fs-5" style={{ color: t.text900 }}>{fmtMoney(economico.ventas)}</div>
            </Card>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Costo mercadería vendida</h6>
              <div className="fs-5" style={{ color: t.text900 }}>{fmtMoney(economico.cmv)}</div>
            </Card>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Resultado bruto</h6>
              <div className="fs-5 fw-semibold" style={{ color: economico.bruto>=0?'#4ade80':'#f87171' }}>{fmtMoney(economico.bruto)}</div>
            </Card>
          </div>

          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Actualizaciones</h6>
              <div className="fs-5" style={{ color: t.text900 }}>{fmtMoney(economico.actualizaciones)}</div>
            </Card>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Faltantes</h6>
              <div className="fs-5" style={{ color: t.text900 }}>{fmtMoney(economico.faltantes)}</div>
            </Card>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <Card>
              <h6 className="mb-1" style={{ color: t.text600 }}>Resultado neto</h6>
              <div className="fs-5 fw-semibold" style={{ color: economico.neto>=0?'#4ade80':'#f87171' }}>{fmtMoney(economico.neto)}</div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {unidadesOrdenadas.map((r, i) => {
            const nombre = r.producto?.nombre || r.comercio?.nombre || r.barrio?.nombre || '-';
            return (
              <Card key={r._id || i}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-truncate" style={{ color: t.text900 }}>{i+1}. {nombre}</div>
                  <div className="small" style={{ color: t.text600 }}>Unidades</div>
                </div>
                <div className="mt-1 fw-semibold" style={{ color: t.text900 }}>{r.unidadesFisicas || 0}</div>
              </Card>
            );
          })}
          {!unidadesOrdenadas.length && !loading && (
            <Card className="text-center" bodyClassName="card-body py-4">
              <div className="text-muted">Sin datos</div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// client/src/pages/Home.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function Home() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const r = await api.get(`/estadisticas/overview?unit=mes&year=${year}&month=${month}`);
        setData(r.data);
      } catch (e) {
        setErr(e?.response?.data?.error || 'No se pudo cargar el overview');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Resumen del Mes</h2>
        <div className="text-muted">
          {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}
      
      {data && (
        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3">
                      <i className="bi bi-box-seam text-primary fs-4"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small">Unidades</div>
                    <div className="fs-3 fw-bold">{data.unidadesFisicas}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3">
                      <i className="bi bi-currency-dollar text-success fs-4"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small">Ventas</div>
                    <div className="fs-3 fw-bold">${data.ventas?.toLocaleString('es-AR')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3">
                      <i className="bi bi-wallet2 text-warning fs-4"></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small">Costo</div>
                    <div className="fs-3 fw-bold">${data.costo?.toLocaleString('es-AR')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-6 col-lg-3">
            <div className={`card border-0 shadow-sm h-100 ${data.ganancias >= 0 ? 'bg-success bg-opacity-10' : 'bg-danger bg-opacity-10'}`}>
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className={`rounded-circle p-3 ${data.ganancias >= 0 ? 'bg-success' : 'bg-danger'}`}>
                      <i className={`bi ${data.ganancias >= 0 ? 'bi-graph-up-arrow' : 'bi-graph-down-arrow'} text-white fs-4`}></i>
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="text-muted small">Ganancias</div>
                    <div className={`fs-3 fw-bold ${data.ganancias >= 0 ? 'text-success' : 'text-danger'}`}>
                      ${data.ganancias?.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
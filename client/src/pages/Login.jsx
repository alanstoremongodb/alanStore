// client/src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import { darkTheme as t } from '../components/ui/theme';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
  await login(form);
  nav('/estadisticas');
    } catch (e) {
      setErr(e?.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    background: t.surface2,
    border: t.border,
    color: t.text900,
    borderRadius: 12,
    padding: '10px 12px',
    outline: 'none',
  };

  const btnStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 12,
    border: t.border,
    color: t.text900,
    background: t.surface2,
    boxShadow: t.cardRaiseSm,
    textAlign: 'center',
    fontWeight: 600,
  };

  return (
    <div
    style={{height: '100vh'}}>
      <div
        className="login"
        style={{
          background: t.bg, color: t.text900, padding: '0 .75rem 16px', boxSizing: 'border-box',
          marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', position: 'relative'
        }}
      >

        <div aria-hidden style={{ position: 'fixed', inset: 0,  zIndex: -1 }} />

        <div className="row" style={{ paddingTop: 40 }}>
          <div className="col-12 col-md-6 col-lg-4 mx-auto" >
            <h1 className="m-0 fw-semibold text-center mb-3" style={{ letterSpacing: '.2px', color: t.text900 }}>AlanStore</h1>
            <p className="text-center mb-4" style={{ color: t.text600 }}>Sistema de Gestión de Inventario</p>

            <Card>
              <div className="vstack gap-3"  >
                <h4 className="m-0 text-center" style={{ color: t.text900 }}>Iniciar sesión</h4>

                {err && (
                  <div className="small" style={{ color: '#ff7b7b' }}>{err}</div>
                )}

                <form onSubmit={onSubmit} className="vstack gap-3" noValidate>
                  <div>
                    <label className="form-label" style={{ color: t.text900 }}>
                      Usuario <span aria-hidden style={{ color: '#ff7b7b' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.usuario}
                      onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                      autoFocus
                      required
                      aria-required
                      style={inputStyle}
                    />
                  </div>

                  <div className="vstack" style={{ gap: 0 }}>
                    <div>
                      <label className="form-label" style={{ color: t.text900 }}>
                        Contraseña <span aria-hidden style={{ color: '#ff7b7b' }}>*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        aria-required
                        style={inputStyle}
                      />
                    </div>

                    <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: 50, marginBottom: -100}}>
                      {loading ? 'Ingresando…' : 'Ingresar'}
                    </button>
                  </div>
                </form>
              </div>
            </Card>

            <div className="text-center mt-3" style={{ color: t.text600 }}>
              <small>© Desarrollado por ENS Soluciones Digitales</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
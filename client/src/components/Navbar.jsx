// client/src/components/Navbar.jsx
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const navRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [navH, setNavH] = useState(56)
  const { logout } = useAuth()
  const nav = useNavigate()

  // Medimos altura del navbar para posicionar el overlay móvil justo debajo
  useEffect(() => {
    const update = () => setNavH(navRef.current?.offsetHeight || 56)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Cerrar al pasar a viewport >= md
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const toggle = () => setOpen(v => !v)
  const closeInstant = () => setOpen(false)

  const handleLogout = async () => {
    closeInstant()
    try { await logout() } finally { nav('/login', { replace: true }) }
  }

  return (
    <>
  <nav ref={navRef} className="navbar navbar-expand-md navbar-dark sticky-top shadow-sm" style={{ background: '#111' }}>
        <div className="container-fluid">
          <Link className="navbar-brand fw-bold" to="/" onClick={closeInstant}>
            AlanStore
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mobileNav"
            aria-expanded={open}
            aria-label="Abrir/cerrar menú"
            onClick={toggle}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse d-none d-md-flex">
            <ul className="navbar-nav ms-auto mb-2 mb-md-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" end>Inicio</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/productos">Productos</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/barrios">Barrios</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/comercios">Comercios</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/movimientos">Movimientos</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/stock">Stock</NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/estadisticas">Estadísticas</NavLink>
              </li>
            </ul>
            <div className="d-flex align-items-center ms-3">
              <button
                type="button"
                className="btn btn-outline-light btn-sm rounded-pill px-3 d-inline-flex align-items-center gap-2"
                style={{ transition: 'background .2s ease, border-color .2s ease, color .2s ease' }}
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        id="mobileNav"
        className="d-md-none"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          top: navH,
          bottom: 0,
          background: '#111',
          zIndex: 1050,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          transition: 'transform 220ms ease, opacity 220ms ease',
          transform: open ? 'translateY(0)' : 'translateY(-12px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          boxShadow: open ? '0 8px 24px rgba(0,0,0,.5)' : 'none',
        }}
        aria-hidden={!open}
      >
        <div className="container-fluid py-3">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/" onClick={closeInstant} end>
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/productos" onClick={closeInstant}>
                Productos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/barrios" onClick={closeInstant}>
                Barrios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/comercios" onClick={closeInstant}>
                Comercios
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/movimientos" onClick={closeInstant}>
                Movimientos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/stock" onClick={closeInstant}>
                Stock
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link text-white" to="/estadisticas" onClick={closeInstant}>
                Estadísticas
              </NavLink>
            </li>
          </ul>
          <div className="d-flex align-items-center mt-3">
            <button
              type="button"
              className="btn btn-outline-light btn-sm rounded-pill d-inline-flex align-items-center gap-2 px-3 py-2"
              style={{ transition: 'background .2s ease, border-color .2s ease, color .2s ease' }}
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
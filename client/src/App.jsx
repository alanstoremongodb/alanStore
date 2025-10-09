import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthLayout from './components/AuthLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute';

// Home eliminado; la pantalla inicial será Estadísticas
import Login from './pages/Login';
import Productos from './pages/Productos';
import ProductoDetalle from './pages/ProductoDetalle'; // 👈 NUEVO
import Comercios from './pages/Comercios';
import Barrios from './pages/Barrios';
import Movimientos from './pages/Movimientos';
import Stock from './pages/Stock';
import Estadisticas from './pages/Estadisticas';

import ComercioDetalle from './pages/ComercioDetalle';
import BarrioDetalle from './pages/BarrioDetalle';
import MovimientoDetalle from './pages/MovimientoDetalle';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

      <Route element={<ProtectedRoute />}>
  <Route element={<Layout><Estadisticas /></Layout>} path="/" />
        <Route element={<Layout><Productos /></Layout>} path="/productos" />
        <Route element={<Layout><ProductoDetalle /></Layout>} path="/productos/:id" /> 
        <Route element={<Layout><Comercios /></Layout>} path="/comercios" />
        <Route element={<Layout><ComercioDetalle /></Layout>} path="/comercios/:id" />
        <Route element={<Layout><Barrios /></Layout>} path="/barrios" />
        <Route element={<Layout><BarrioDetalle /></Layout>} path="/barrios/:id" />
        <Route element={<Layout><Movimientos /></Layout>} path="/movimientos" />
        <Route element={<Layout><MovimientoDetalle /></Layout>} path="/movimientos/:id" /> 
    <Route element={<Layout><Stock /></Layout>} path="/stock" />
        <Route element={<Layout><Estadisticas /></Layout>} path="/estadisticas" />
      </Route>

  <Route path="*" element={<Navigate to="/estadisticas" replace />} />
    </Routes>
  );
}

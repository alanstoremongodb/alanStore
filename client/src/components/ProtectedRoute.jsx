import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, booting } = useAuth();
  if (booting) return <div className="container py-5">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

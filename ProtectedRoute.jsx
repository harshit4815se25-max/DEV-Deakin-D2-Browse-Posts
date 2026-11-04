import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="page-state">Checking your account…</main>;
  }

  return user ? children : <Navigate to="/login" replace />;
}

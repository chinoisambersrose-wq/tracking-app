import { Navigate } from 'react-router-dom';
import { useAuth, Role } from '../hooks/useAuth';

export function ProtectedRoute({ roles, children }: { roles: Role[]; children: JSX.Element }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />;

  return children;
}
